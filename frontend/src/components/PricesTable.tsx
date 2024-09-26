import {FC, useEffect, useMemo, useState} from 'react';
import cl from 'classnames';

import {PriceKlineSeries} from '../services/PriceDataSource';
import {useSelectedSymbolsContext} from '../hooks/useSelectedSymbolsContext';

const compactNum = Intl.NumberFormat('en-US', {notation: 'compact'});

function makeBinancePathParamOfSymbol(symbol: string): string {
  return symbol.split('USDT')[0] + '_USDT';
}

function baseCoinOnly(symbol: string): string {
  return symbol.split('USDT')[0];
}

function r(n: number): number {
  return Math.round(10 * n) / 10;
}

type Props = {
  allSymbols: string[];
  kline15mSeriesList: PriceKlineSeries[];
  kline1DSeriesList: PriceKlineSeries[];
};

type Symbol1DStats = {
  todayQuotVol: number;
  todayOpenPrice: number;
  todayLatestPrice: number;
};

type Symbol15mStats = {
  rsichg: [number, number, number];
};

const PricesTable: FC<Props> = ({allSymbols, kline1DSeriesList, kline15mSeriesList}) => {
  const mapSymbol1DStats = useMemo<Record<string, Symbol1DStats>>(() => {
    const symbol1DStats: Record<string, Symbol1DStats> = {};
    for (const kline1dSeries of kline1DSeriesList) {
      const symbol = kline1dSeries.symbol;
      const klineData = kline1dSeries.priceKlineData || [];
      const todayQuotVol = klineData[klineData.length - 1]?.quotVol ?? 0;
      const todayOpenPrice = klineData[klineData.length - 1]?.openPrice ?? 0;
      const todayLatestPrice = klineData[klineData.length - 1]?.closePrice ?? 0;
      symbol1DStats[symbol] = {todayQuotVol, todayOpenPrice, todayLatestPrice};
    }
    return symbol1DStats;
  }, [kline1DSeriesList]);

  const [mapSymbol15mStats, setMapSymbol15mStats] = useState<Record<string, Symbol15mStats>>({});
  useEffect(() => {
    setMapSymbol15mStats((oldMap) => {
      const newMap = {...oldMap};

      for (const kline15mSeries of kline15mSeriesList) {
        const symbol = kline15mSeries.symbol;
        const klineData = kline15mSeries.priceKlineData || [];
        const previousKline = klineData[klineData.length - 2];
        const latestKline = klineData[klineData.length - 1];
        const diffVsPrev = previousKline
          ? (latestKline?.rsi14 ?? 0) - (previousKline?.rsi14 ?? 0)
          : 0;
        const diffVsMin = (latestKline?.rsi14 ?? 0) - (latestKline?.rsi14Min ?? 0);
        const diffVsMax = (latestKline?.rsi14 ?? 0) - (latestKline?.rsi14Max ?? 0);
        newMap[symbol] = {rsichg: [diffVsPrev, diffVsMin, diffVsMax]};
      }

      return newMap;
    });
  }, [kline15mSeriesList]);

  const sortedSymbols = useMemo<string[]>(() => {
    return [...allSymbols].sort((a, b) => {
      return (mapSymbol15mStats[a]?.rsichg?.[0] || 0) - (mapSymbol15mStats[b]?.rsichg?.[0] || 0);
    });
  }, [allSymbols, mapSymbol15mStats]);

  const {selectedSymbols, handleToggleSymbol} = useSelectedSymbolsContext();

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm text-left rtl:text-right text-gray-500 table-fixed">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 overflow-hidden whitespace-nowrap text-ellipsis">
              Symbol
            </th>
            <th
              scope="col"
              className="w-1/5 px-6 py-3 overflow-hidden whitespace-nowrap text-ellipsis"
            >
              Price
            </th>
            <th scope="col" className="px-6 py-3 overflow-hidden whitespace-nowrap text-ellipsis">
              Change
            </th>
            <th scope="col" className="px-6 py-3 overflow-hidden whitespace-nowrap text-ellipsis">
              Volume
            </th>
            <th
              scope="col"
              className="w-1/3 px-6 py-3 overflow-hidden whitespace-nowrap text-ellipsis"
            >
              RSIChg 15m
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedSymbols.map((s) => {
            const todayQuotVol = mapSymbol1DStats[s]?.todayQuotVol || 0;
            const todayOpenPrice = mapSymbol1DStats[s]?.todayOpenPrice || 0;
            const todayLatestPrice = mapSymbol1DStats[s]?.todayLatestPrice || 0;
            const todayChange =
              todayOpenPrice > 0
                ? Math.round(100 * ((100 * (todayLatestPrice - todayOpenPrice)) / todayOpenPrice)) /
                  100
                : 0;
            const rsichg = (mapSymbol15mStats[s]?.rsichg || [0, 0, 0]).map((v) => r(v));
            return (
              <tr
                key={s}
                className={cl('border-b cursor-pointer', {
                  'bg-white': !selectedSymbols[s],
                  'bg-yellow-50': selectedSymbols[s],
                })}
                onClick={() => handleToggleSymbol(s)}
              >
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 overflow-hidden whitespace-nowrap text-ellipsis"
                >
                  <a
                    className={cl('hover:underline', {
                      'font-bold': selectedSymbols[s],
                      'text-yellow-600': selectedSymbols[s],
                    })}
                    href={`https://www.binance.com/trade/${makeBinancePathParamOfSymbol(s)}?type=spot`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {baseCoinOnly(s)}
                  </a>
                </th>
                <td
                  className={cl('px-6 py-4 overflow-hidden whitespace-nowrap text-ellipsis', {
                    'text-green-600': todayLatestPrice > todayOpenPrice,
                    'text-red-600': todayLatestPrice < todayOpenPrice,
                  })}
                >
                  $
                  {todayLatestPrice.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 100,
                  })}
                </td>
                <td
                  className={cl('px-6 py-4 overflow-hidden whitespace-nowrap text-ellipsis', {
                    'text-green-600': todayChange > 0,
                    'text-red-600': todayChange < 0,
                  })}
                >
                  {todayChange > 0 ? '+' : ''}
                  {todayChange}%
                </td>
                <td className="px-6 py-4 overflow-hidden whitespace-nowrap text-ellipsis">
                  ${compactNum.format(todayQuotVol)}
                </td>
                <td className="px-6 py-4 overflow-hidden whitespace-nowrap text-ellipsis">
                  <div className="w-full flex items-center">
                    {rsichg.map((v) => (
                      <span
                        className={cl('inline-block w-10', {
                          'text-green-600': v > 0,
                          'text-red-600': v < 0,
                        })}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PricesTable;
