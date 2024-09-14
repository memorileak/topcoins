import {FC} from 'react';

import RSIVolChart from './components/RSIVolChart';
import {usePriceData} from './hooks/usePriceData';

const App: FC<{}> = () => {
  const {priceNowList, priceKline1HSeriesList} = usePriceData();

  return (
    <div className="w-screen h-screen">
      <RSIVolChart klineSeriesList={priceKline1HSeriesList} priceNowList={priceNowList} />
    </div>
  );
};

export default App;
