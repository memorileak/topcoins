import {FC, useCallback, useEffect, useMemo, useRef} from 'react';

import {Result} from './devkit';
import {PriceKlineSeries, PriceNow} from './services/PriceDataSource';
import {usePriceData} from './hooks/usePriceData';
import {SelectedSymbolsContext, useSelectedSymbols} from './hooks/useSelectedSymbolsContext';
import RSIVolChart, {RSIInterval} from './components/RSIVolChart';
import PricesTable from './components/PricesTable';
import Footer from './components/Footer';

function updateKlineSeriesListWithPriceNowList(
  klineSeriesList: PriceKlineSeries[],
  priceNowList: PriceNow[],
) {
  const mapSymbolPriceNow: Record<string, PriceNow> = {};

  for (const p of priceNowList) {
    mapSymbolPriceNow[p.symbol] = p;
  }

  for (const klineSeries of klineSeriesList) {
    const priceKlineData = klineSeries.priceKlineData || [];
    const latestKline = priceKlineData[priceKlineData.length - 1];
    if (latestKline && mapSymbolPriceNow[klineSeries.symbol]?.price) {
      const latestPrice = mapSymbolPriceNow[klineSeries.symbol]?.price ?? 0;
      latestKline.closePrice = latestPrice;
      latestKline.highPrice =
        latestPrice > latestKline.highPrice ? latestPrice : latestKline.highPrice;
      latestKline.lowPrice =
        latestPrice < latestKline.lowPrice ? latestPrice : latestKline.lowPrice;

      klineSeries.rsi14Indexer.replace(latestKline.lowPrice);
      latestKline.rsi14Min = Result.fromExecution(() =>
        parseFloat(klineSeries.rsi14Indexer.getResult().toFixed(2)),
      ).unwrapOr(0);

      klineSeries.rsi14Indexer.replace(latestKline.highPrice);
      latestKline.rsi14Max = Result.fromExecution(() =>
        parseFloat(klineSeries.rsi14Indexer.getResult().toFixed(2)),
      ).unwrapOr(0);

      klineSeries.rsi14Indexer.replace(latestKline.closePrice);
      latestKline.rsi14 = Result.fromExecution(() =>
        parseFloat(klineSeries.rsi14Indexer.getResult().toFixed(2)),
      ).unwrapOr(0);
    }
  }

  return klineSeriesList;
}

const App: FC<{}> = () => {
  const {
    allSymbols,
    priceNowList,
    priceKline15mSeriesList,
    priceKline1HSeriesList,
    priceKline1DSeriesList,
    reloadAllSymbols,
    reloadPriceNowList,
    reloadPriceKline15mSeriesList,
    reloadPriceKline1HSeriesList,
    reloadPriceKline1DSeriesList,
  } = usePriceData();

  // Reload Price now data every 5 seconds
  const reloadPriceNowInterval = useRef<NodeJS.Timer>();
  useEffect(() => {
    clearInterval(reloadPriceNowInterval.current);
    reloadPriceNowInterval.current = setInterval(() => {
      reloadPriceNowList();
    }, 5 * 1000);
  }, [reloadPriceNowList]);

  // Reload Kline data every 60 seconds
  const reloadPriceKlineInterval = useRef<NodeJS.Timer>();
  useEffect(() => {
    clearInterval(reloadPriceKlineInterval.current);
    reloadPriceKlineInterval.current = setInterval(() => {
      reloadPriceKline15mSeriesList();
      reloadPriceKline1HSeriesList();
      reloadPriceKline1DSeriesList();
    }, 60 * 1000);
  }, [reloadPriceKline15mSeriesList, reloadPriceKline1HSeriesList, reloadPriceKline1DSeriesList]);

  const priceKline15mSeriesListUpToDate = useMemo(
    () => updateKlineSeriesListWithPriceNowList(priceKline15mSeriesList, priceNowList),
    [priceKline15mSeriesList, priceNowList],
  );

  const priceKline1HSeriesListUpToDate = useMemo(
    () => updateKlineSeriesListWithPriceNowList(priceKline1HSeriesList, priceNowList),
    [priceKline1HSeriesList, priceNowList],
  );

  const priceKline1DSeriesListUpToDate = useMemo(
    () => updateKlineSeriesListWithPriceNowList(priceKline1DSeriesList, priceNowList),
    [priceKline1DSeriesList, priceNowList],
  );

  const selectedSymbolsData = useSelectedSymbols();

  const reloadAllData = useCallback(() => {
    reloadAllSymbols();
    reloadPriceNowList();
    reloadPriceKline15mSeriesList();
    reloadPriceKline1HSeriesList();
    reloadPriceKline1DSeriesList();
  }, [
    reloadAllSymbols,
    reloadPriceNowList,
    reloadPriceKline15mSeriesList,
    reloadPriceKline1HSeriesList,
    reloadPriceKline1DSeriesList,
  ]);

  return (
    <SelectedSymbolsContext.Provider value={selectedSymbolsData}>
      <div className="w-full xl:w-11/12 xl:mx-auto pt-16 pb-64">
        <h1 className="text-3xl text-center font-bold mb-12">
          {process.env.REACT_APP_WEBSITE_NAME || 'Top Coins'}
        </h1>
        <div className="flex flex-col-reverse xl:flex-row flex-wrap">
          <div className="w-full xl:w-2/5 mb-12">
            <h2 className="text-center text-sm text-zinc-600 font-bold mb-4">Today Prices</h2>
            <div className="w-11/12 mx-auto xl:w-full">
              <PricesTable
                allSymbols={allSymbols}
                kline15mSeriesList={priceKline15mSeriesListUpToDate}
                kline1DSeriesList={priceKline1DSeriesListUpToDate}
              />
            </div>
          </div>
          <div className="w-full xl:w-3/5 mb-12">
            <h2 className="text-center text-sm text-zinc-600 font-bold mb-4">
              RSI 14 & Volumes 15m
            </h2>
            <div className="w-full aspect-video mb-12">
              <RSIVolChart
                interval={RSIInterval._15Minutes}
                allSymbols={allSymbols}
                klineSeriesList={priceKline15mSeriesListUpToDate}
              />
            </div>
            <h2 className="text-center text-sm text-zinc-600 font-bold mb-4">
              RSI 14 & Volumes 1H
            </h2>
            <div className="w-full aspect-video mb-12">
              <RSIVolChart
                interval={RSIInterval._1Hour}
                allSymbols={allSymbols}
                klineSeriesList={priceKline1HSeriesListUpToDate}
              />
            </div>
            <h2 className="text-center text-sm text-zinc-600 font-bold mb-4">
              RSI 14 & Volumes 1D
            </h2>
            <div className="w-full aspect-video">
              <RSIVolChart
                interval={RSIInterval._1Day}
                allSymbols={allSymbols}
                klineSeriesList={priceKline1DSeriesListUpToDate}
              />
            </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="fixed bottom-8 right-8 rounded-full opacity-50 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-4 focus:ring-green-300/25 text-green-700 bg-green-600/25 px-5 py-5"
        onClick={reloadAllData}
      >
        <svg
          className="w-6 h-6"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M17.651 7.65a7.131 7.131 0 0 0-12.68 3.15M18.001 4v4h-4m-7.652 8.35a7.13 7.13 0 0 0 12.68-3.15M6 20v-4h4"
          />
        </svg>
      </button>
      <Footer />
    </SelectedSymbolsContext.Provider>
  );
};

export default App;
