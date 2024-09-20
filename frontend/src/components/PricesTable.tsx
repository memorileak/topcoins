import {FC, useMemo} from 'react';
import cl from 'classnames';

import {PriceKlineSeries, PriceNow} from '../services/PriceDataSource';

const compactNum = Intl.NumberFormat('en-US', {notation: 'compact'});

function makeBinancePathParamOfSymbol(symbol: string): string {
  return symbol.split('USDT')[0] + '_USDT';
}

type Props = {
  priceNowList: PriceNow[];
  kline1DSeriesList: PriceKlineSeries[];
};

type SymbolDStats = {
  todayQuotVol: number;
  todayOpenPrice: number;
};

const PricesTable: FC<Props> = ({priceNowList, kline1DSeriesList}) => {
  const mapSymbolDStats = useMemo<Record<string, SymbolDStats>>(() => {
    const symbolDStats: Record<string, SymbolDStats> = {};
    for (const kline1dSeries of kline1DSeriesList) {
      const symbol = kline1dSeries.symbol;
      const klineData = kline1dSeries.priceKlineData || [];
      const todayQuotVol = klineData[klineData.length - 1].quotVol;
      const todayOpenPrice = klineData[klineData.length - 1].openPrice;
      symbolDStats[symbol] = {todayQuotVol, todayOpenPrice};
    }
    return symbolDStats;
  }, [kline1DSeriesList]);

  const sortedPriceNowList = useMemo<PriceNow[]>(() => {
    return [...priceNowList].sort((a, b) => {
      return (
        (mapSymbolDStats[b.symbol]?.todayQuotVol || 0) -
        (mapSymbolDStats[a.symbol]?.todayQuotVol || 0)
      );
    });
  }, [priceNowList, mapSymbolDStats]);

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
          {sortedPriceNowList.map((p) => {
            const todayOpenPrice = mapSymbolDStats[p.symbol]?.todayOpenPrice || 0;
            const todayQuotVol = mapSymbolDStats[p.symbol]?.todayQuotVol || 0;
            const todayChange =
              todayOpenPrice > 0
                ? Math.round(100 * ((100 * (p.price - todayOpenPrice)) / todayOpenPrice)) / 100
                : 0;
            return (
              <tr key={p.symbol} className="bg-white border-b">
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 overflow-hidden whitespace-nowrap text-ellipsis"
                >
                  <a
                    href={`https://www.binance.com/trade/${makeBinancePathParamOfSymbol(p.symbol)}?type=spot`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {p.symbol}
                  </a>
                </th>
                <td
                  className={cl('px-6 py-4 overflow-hidden whitespace-nowrap text-ellipsis', {
                    'text-green-600': p.price > todayOpenPrice,
                    'text-red-600': p.price < todayOpenPrice,
                  })}
                >
                  $
                  {p.price.toLocaleString('en-US', {
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
