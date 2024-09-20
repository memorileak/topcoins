import {FC, useCallback, useMemo, useState} from 'react';
import * as d3 from 'd3';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';

import {PriceKlineSeries, PriceNow} from '../services/PriceDataSource';
import {Result} from '../devkit';

export enum RSIInterval {
  _1Hour = '1h',
  _1Day = '1d',
}

const timefmt: Record<RSIInterval, (d: Date) => string> = {
  [RSIInterval._1Hour]: d3.timeFormat('%a %H:%M'),
  [RSIInterval._1Day]: d3.utcFormat('%d/%m'),
};

const volrad: Record<RSIInterval, (v: number) => number> = {
  [RSIInterval._1Hour]: d3.scaleLinear([1, 6e8], [2, 60]).clamp(true).unknown(2),
  [RSIInterval._1Day]: d3.scaleLinear([1, 9e9], [2, 60]).clamp(true).unknown(2),
};

const compactNum = Intl.NumberFormat('en-US', {notation: 'compact'});

function isEmptyObject(obj: object): boolean {
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      return false;
    }
  }
  return true;
}

function isAllFalsyObject(obj: object): boolean {
  for (const prop in obj) {
    if ((obj as any)[prop]) {
      return false;
    }
  }
  return true;
}

const VolDot = (props: Record<string, any>) => {
  const {interval, cx, cy, stroke, payload, dataKey, activeSymbols} = props;
  const symbol = dataKey;
  const quotVolKey = `quotVol_${symbol}`;
  const quotVol = payload[quotVolKey];
  const r = volrad[interval as RSIInterval](quotVol);
  const color = d3.color(stroke)!.copy({opacity: 0.5}).formatHex8();
  return (
    <g>
      <rect x={cx - r} y={cy - r} width={2 * r} height={2 * r} stroke={color} fill={color} />
      {activeSymbols[symbol] ? (
        <text
          textAnchor="middle"
          fontSize="smaller"
          x={cx}
          y={cy - r - 4}
          stroke="none"
          fill={stroke}
        >
          {compactNum.format(quotVol)}
        </text>
      ) : null}
    </g>
  );
};

type Props = {
  interval: RSIInterval;
  allSymbols: string[];
  klineSeriesList: PriceKlineSeries[];
  priceNowList: PriceNow[];
};

const RSIVolChart: FC<Props> = ({interval, allSymbols, klineSeriesList, priceNowList}) => {
  const lineChartData = useMemo(() => {
    const chartData: Record<string, any>[] = [];
    const mapTimeRecord: Map<number, Record<string, any>> = new Map();
    const mapSymbolPriceNow: Record<string, PriceNow> = {};

    for (const p of priceNowList) {
      mapSymbolPriceNow[p.symbol] = p;
    }

    for (const klineSeries of klineSeriesList) {
      const priceKlineData = klineSeries.priceKlineData || [];
      const latestKline = priceKlineData[priceKlineData.length - 1];

      if (latestKline) {
        latestKline.closePrice =
          mapSymbolPriceNow[klineSeries.symbol]?.price ?? latestKline.closePrice;
        klineSeries.rsi14Indexer.replace(latestKline.closePrice);
        latestKline.rsi14 = Result.fromExecution(() =>
          parseFloat(klineSeries.rsi14Indexer.getResult().toFixed(2)),
        ).unwrapOr(0);
      }

      for (const priceKline of priceKlineData) {
        if (!mapTimeRecord.has(priceKline.closeTime)) {
          mapTimeRecord.set(priceKline.closeTime, {});
        }
        mapTimeRecord.get(priceKline.closeTime)![priceKline.symbol] = priceKline.rsi14;
        mapTimeRecord.get(priceKline.closeTime)![`quotVol_${priceKline.symbol}`] =
          priceKline.quotVol;
      }
    }

    const iter = mapTimeRecord.entries();
    while (true) {
      const {value, done} = iter.next();
      if (done) {
        break;
      } else {
        const [closeTime, data] = value;
        chartData.push({
          ...data,
          closeTime,
          closeTimeDisplay: timefmt[interval](new Date(closeTime)),
        });
      }
    }

    chartData.sort((a, b) => a.closeTime - b.closeTime);

    return chartData.slice(2 * 14);
  }, [interval, klineSeriesList, priceNowList]);

  const colorScale = useMemo(
    () =>
      d3.scaleQuantize(
        [0, allSymbols.length],
        d3.schemeCategory10.concat(d3.schemeSet1).concat(d3.schemeDark2).concat(d3.schemeTableau10),
      ),
    [allSymbols],
  );

  const [activeSymbols, setActiveSymbols] = useState<Record<string, boolean>>({});
  const handleToggleSymbol = useCallback(
    (symbol: string) => {
      const newActiveSymbols = {...activeSymbols};
      if (activeSymbols[symbol]) {
        newActiveSymbols[symbol] = false;
        if (isAllFalsyObject(newActiveSymbols)) {
          for (let s in newActiveSymbols) {
            delete newActiveSymbols[s];
          }
        }
      } else {
        if (isEmptyObject(newActiveSymbols)) {
          for (const s of allSymbols) {
            newActiveSymbols[s] = false;
          }
        }
        newActiveSymbols[symbol] = true;
      }
      setActiveSymbols(newActiveSymbols);
    },
    [allSymbols, activeSymbols],
  );

  return (
    <>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={lineChartData}
          margin={{
            top: 0,
            right: 60,
            left: 10,
            bottom: 0,
          }}
        >
          <CartesianGrid horizontal={false} vertical={false} />
          <XAxis dataKey="closeTimeDisplay" />
          <YAxis domain={[0, 100]} />
          <ReferenceArea y1={70} y2={100} stroke="none" fill="#2ca02c80" label="OVERBOUGHT" />
          <ReferenceArea y1={60} y2={70} stroke="none" fill="#2ca02c40" label="STRONG" />
          <ReferenceArea y1={20} y2={30} stroke="none" fill="#d6272840" label="WEAK" />
          <ReferenceArea y1={0} y2={20} stroke="none" fill="#d6272880" label="OVERSOLD" />
          <ReferenceLine y={50} />
          <Tooltip
            itemSorter={(d) => -(d.value as number)}
            isAnimationActive={false}
            wrapperStyle={{zIndex: 9999}}
          />
          <Legend
            wrapperStyle={{cursor: 'pointer', userSelect: 'none'}}
            onClick={({value: symbol}) => handleToggleSymbol(symbol)}
          />
          {allSymbols.map((s, i) => (
            <Line
              hide={activeSymbols[s] === false}
              key={s}
              type="monotone"
              strokeDasharray="5 1"
              dataKey={s}
              stroke={colorScale(i)}
              dot={<VolDot interval={interval} activeSymbols={activeSymbols} />}
              activeDot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
};

export default RSIVolChart;
