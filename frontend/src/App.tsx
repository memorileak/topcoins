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
    <div className="w-screen flex">
      <div className="w-2/3 aspect-video">
        <RSIVolChart
          interval={RSIInterval._1Hour}
          allSymbols={allSymbols}
          klineSeriesList={priceKline1HSeriesList}
          priceNowList={priceNowList}
        />
        <RSIVolChart
          interval={RSIInterval._1Day}
          allSymbols={allSymbols}
          klineSeriesList={priceKline1DSeriesList}
          priceNowList={priceNowList}
        />
      </div>
      <div className="w-1/3">Hello</div>
    </div>
  );
};

export default App;
