import {FC, useMemo} from 'react';
import cl from 'classnames';

import {PriceKlineSeries} from '../services/PriceDataSource';

const compactNum = Intl.NumberFormat('en-US', {notation: 'compact'});

function makeBinancePathParamOfSymbol(symbol: string): string {
  return symbol.split('USDT')[0] + '_USDT';
}

type Props = {
  allSymbols: string[];
  kline1DSeriesList: PriceKlineSeries[];
};

type SymbolDStats = {
  todayQuotVol: number;
  todayOpenPrice: number;
  todayLatestPrice: number;
};

const PricesTable: FC<Props> = ({allSymbols, kline1DSeriesList}) => {
  const mapSymbolDStats = useMemo<Record<string, SymbolDStats>>(() => {
    const symbolDStats: Record<string, SymbolDStats> = {};
    for (const kline1dSeries of kline1DSeriesList) {
      const symbol = kline1dSeries.symbol;
      const klineData = kline1dSeries.priceKlineData || [];
      const todayQuotVol = klineData[klineData.length - 1].quotVol;
      const todayOpenPrice = klineData[klineData.length - 1].openPrice;
      const todayLatestPrice = klineData[klineData.length - 1].closePrice;
      symbolDStats[symbol] = {todayQuotVol, todayOpenPrice, todayLatestPrice};
    }
    return symbolDStats;
  }, [kline1DSeriesList]);

  const sortedSymbols = useMemo<string[]>(() => {
    return [...allSymbols].sort((a, b) => {
      return (mapSymbolDStats[b]?.todayQuotVol || 0) - (mapSymbolDStats[a]?.todayQuotVol || 0);
    });
  }, [allSymbols, mapSymbolDStats]);

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
              className="w-1/3 px-6 py-3 overflow-hidden whitespace-nowrap text-ellipsis"
            >
              Price
            </th>
            <th scope="col" className="px-6 py-3 overflow-hidden whitespace-nowrap text-ellipsis">
              Change
            </th>
            <th scope="col" className="px-6 py-3 overflow-hidden whitespace-nowrap text-ellipsis">
              Volume
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedSymbols.map((s) => {
            const todayQuotVol = mapSymbolDStats[s]?.todayQuotVol || 0;
            const todayOpenPrice = mapSymbolDStats[s]?.todayOpenPrice || 0;
            const todayLatestPrice = mapSymbolDStats[s]?.todayLatestPrice || 0;
            const todayChange =
              todayOpenPrice > 0
                ? Math.round(100 * ((100 * (todayLatestPrice - todayOpenPrice)) / todayOpenPrice)) /
                  100
                : 0;
            return (
              <tr key={s} className="bg-white border-b">
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 overflow-hidden whitespace-nowrap text-ellipsis"
                >
                  <a
                    href={`https://www.binance.com/trade/${makeBinancePathParamOfSymbol(s)}?type=spot`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s}
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PricesTable;
