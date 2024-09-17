import {FC, useEffect, useRef} from 'react';

import RSIVolChart, {RSIInterval} from './components/RSIVolChart';
import {usePriceData} from './hooks/usePriceData';

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
    <div className="w-full pt-16 pb-80">
      <h1 className="text-3xl text-center font-bold mb-12">Top Coins</h1>
      <div className="flex flex-wrap">
        <div className="w-full lg:w-1/4 xl:1/6 mb-12 lg:mb-0">
          <h2 className="text-center text-sm text-zinc-600 font-bold">Prices</h2>
        </div>
        <div className="w-full lg:w-3/4 xl:5/6">
          <h2 className="text-center text-sm text-zinc-600 font-bold">RSI 14 & Volumes 1H</h2>
          <div className="w-full aspect-video mb-12">
            <RSIVolChart
              interval={RSIInterval._1Hour}
              allSymbols={allSymbols}
              klineSeriesList={priceKline1HSeriesList}
              priceNowList={priceNowList}
            />
          </div>
          <h2 className="text-center text-sm text-zinc-600 font-bold">RSI 14 & Volumes 1D</h2>
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
  );
};

export default App;
