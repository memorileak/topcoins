import {FC, useEffect, useRef} from 'react';

import {usePriceData} from './hooks/usePriceData';
import RSIVolChart, {RSIInterval} from './components/RSIVolChart';
import PricesTable from './components/PricesTable';
import Footer from './components/Footer';

const App: FC<{}> = () => {
  const {
    allSymbols,
    priceNowList,
    priceKline1HSeriesList,
    priceKline1DSeriesList,
    reloadPriceNowList,
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
      reloadPriceKline1HSeriesList();
      reloadPriceKline1DSeriesList();
    }, 60 * 1000);
  }, [reloadPriceKline1HSeriesList, reloadPriceKline1DSeriesList]);

  return (
    <>
      <div className="w-full xl:w-11/12 xl:mx-auto pt-16 pb-64">
        <h1 className="text-3xl text-center font-bold mb-12">Top Coins</h1>
        <div className="flex flex-col-reverse xl:flex-row flex-wrap">
          <div className="w-full xl:w-1/4 xl:1/6 mb-12">
            <h2 className="text-center text-sm text-zinc-600 font-bold mb-4">Today Prices</h2>
            <div className="w-11/12 mx-auto xl:w-full">
              <PricesTable priceNowList={priceNowList} kline1DSeriesList={priceKline1DSeriesList} />
            </div>
          </div>
          <div className="w-full xl:w-3/4 xl:5/6 mb-12">
            <h2 className="text-center text-sm text-zinc-600 font-bold mb-4">
              RSI 14 & Volumes 1H
            </h2>
            <div className="w-full aspect-video mb-12">
              <RSIVolChart
                interval={RSIInterval._1Hour}
                allSymbols={allSymbols}
                klineSeriesList={priceKline1HSeriesList}
                priceNowList={priceNowList}
              />
            </div>
            <h2 className="text-center text-sm text-zinc-600 font-bold mb-4">
              RSI 14 & Volumes 1D
            </h2>
            <div className="w-full aspect-video">
              <RSIVolChart
                interval={RSIInterval._1Day}
                allSymbols={allSymbols}
                klineSeriesList={priceKline1DSeriesList}
                priceNowList={priceNowList}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default App;
