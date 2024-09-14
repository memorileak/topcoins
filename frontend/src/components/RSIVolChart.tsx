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
  //BarChart,
  //Bar,
} from 'recharts';

import {PriceKlineSeries, PriceNow} from '../services/PriceDataSource';

const hourFormatter = d3.timeFormat('%d/%m %H:%M');

type Props = {
  klineSeriesList: PriceKlineSeries[];
  priceNowList: PriceNow[];
};

const RSIVolChart: FC<Props> = ({klineSeriesList, priceNowList}) => {
  const lineChartData = useMemo(() => {
    const chartData: Record<string, any>[] = [];
    const mapTimeRecord: Map<number, Record<string, any>> = new Map();

    for (const klineSeries of klineSeriesList) {
      for (const priceKline of klineSeries.priceKlineData) {
        if (!mapTimeRecord.has(priceKline.closeTime)) {
          mapTimeRecord.set(priceKline.closeTime, {});
        }
        mapTimeRecord.get(priceKline.closeTime)![priceKline.symbol] = priceKline.rsi14;
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
          closeTimeDisplay: hourFormatter(new Date(closeTime)),
        });
      }
    }

    chartData.sort((a, b) => a.closeTime - b.closeTime);

    return chartData;
  //}, [klineSeriesList, priceNowList]);
  }, [klineSeriesList]);

  const symbols = useMemo(() => priceNowList.map((p) => p.symbol), [priceNowList]);

  return (
    <>
      <ResponsiveContainer width="50%" height="50%">
        <LineChart
          syncId="anyid"
          data={lineChartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="closeTimeDisplay" />
          <YAxis />
          <Tooltip />
          <Legend
            onClick={(...anything) => {
              console.log(anything);
            }}
          />
          {symbols.map((s, i) => (
            <Line
              key={s}
              type="monotone"
              dataKey={s}
              stroke={d3.schemeCategory10[i % 10]}
              activeDot={{r: 8}}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {/*<ResponsiveContainer width="50%" height="25%">
        <BarChart
          syncId="anyid"
          data={klineData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={hourF} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="volume" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>*/}
    </>
  );
};

export default RSIVolChart;
