import {FC, useMemo} from 'react';
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

import {PriceKlineSeries} from '../services/PriceDataSource';
import {useSelectedSymbolsContext} from '../hooks/useSelectedSymbolsContext';

export enum RSIInterval {
  _15Minutes = '15m',
  _1Hour = '1h',
  _1Day = '1d',
}

function baseCoinOnly(symbol: string): string {
  return symbol.split('USDT')[0];
}

const timefmt: Record<RSIInterval, (d: Date) => string> = {
  [RSIInterval._15Minutes]: d3.timeFormat('%H:%M'),
  [RSIInterval._1Hour]: d3.timeFormat('%a %H:%M'),
  [RSIInterval._1Day]: d3.utcFormat('%d/%m'),
};

const volrad: Record<RSIInterval, (v: number) => number> = {
  [RSIInterval._15Minutes]: d3.scaleLinear([1, 15e7], [2, 60]).clamp(true).unknown(2),
  [RSIInterval._1Hour]: d3.scaleLinear([1, 6e8], [2, 60]).clamp(true).unknown(2),
  [RSIInterval._1Day]: d3.scaleLinear([1, 9e9], [2, 60]).clamp(true).unknown(2),
};

const compactNum = Intl.NumberFormat('en-US', {notation: 'compact'});

const VolDot = (props: Record<string, any>) => {
  const {interval, cx, cy, stroke, payload, dataKey, selectedSymbols} = props;
  const symbol = dataKey;
  const quotVolKey = `quotVol_${symbol}`;
  const quotVol = payload[quotVolKey];
  const r = volrad[interval as RSIInterval](quotVol);
  const color = d3.color(stroke)!.copy({opacity: 0.5}).formatHex8();
  return (
    <g>
      <rect x={cx - r} y={cy - r} width={2 * r} height={2 * r} stroke={color} fill={color} />
      {selectedSymbols[symbol] ? (
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
};

const RSIVolChart: FC<Props> = ({interval, allSymbols, klineSeriesList}) => {
  const lineChartData = useMemo(() => {
    const chartData: Record<string, any>[] = [];
    const mapTimeRecord: Map<number, Record<string, any>> = new Map();

    for (const klineSeries of klineSeriesList) {
      const priceKlineData = klineSeries.priceKlineData || [];
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
  }, [interval, klineSeriesList]);

  const colorScale = useMemo(
    () =>
      d3.scaleQuantize(
        [0, allSymbols.length],
        d3.schemeCategory10.concat(d3.schemeSet1).concat(d3.schemeDark2).concat(d3.schemeTableau10),
      ),
    [allSymbols],
  );

  const {selectedSymbols, handleToggleSymbol} = useSelectedSymbolsContext();

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
            formatter={(v, s) => [v, baseCoinOnly(s as string)]}
            isAnimationActive={false}
            wrapperStyle={{zIndex: 9999}}
          />
          <Legend
            formatter={(symbol) => baseCoinOnly(symbol)}
            wrapperStyle={{cursor: 'pointer', userSelect: 'none'}}
            onClick={({value: symbol}) => handleToggleSymbol(symbol)}
          />
          {allSymbols.map((s, i) => (
            <Line
              hide={selectedSymbols[s] === false}
              key={s}
              type="monotone"
              strokeDasharray="5 1"
              dataKey={s}
              stroke={colorScale(i)}
              dot={<VolDot interval={interval} selectedSymbols={selectedSymbols} />}
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
