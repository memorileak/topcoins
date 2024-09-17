import {useCallback, useEffect, useState} from 'react';

import {inject, Services} from '../services/injection';
import {PriceDataSource, PriceKlineSeries, PriceNow} from '../services/PriceDataSource';

type PriceData = {
  allSymbols: string[];
  priceNowList: PriceNow[];
  priceKline1HSeriesList: PriceKlineSeries[];
  priceKline1DSeriesList: PriceKlineSeries[];
  reloadAllSymbols: () => void;
  reloadPriceNowList: () => void;
  reloadPriceKline1HSeriesList: () => void;
  reloadPriceKline1DSeriesList: () => void;
};

export function usePriceData(): PriceData {
  const priceDataSource = inject<PriceDataSource>(Services.PriceDataSource);

  const [allSymbols, setAllSymbols] = useState<string[]>([]);
  const [reloadAllSymbolsToken, setReloadAllSymbolsToken] = useState<Symbol>(Symbol());

  const [priceNowList, setPriceNowList] = useState<PriceNow[]>([]);
  const [reloadPriceNowToken, setReloadPriceNowToken] = useState<Symbol>(Symbol());

  const [priceKline1HSeriesList, setPriceKline1HSeriesList] = useState<PriceKlineSeries[]>([]);
  const [reloadPriceKline1HToken, setReloadPriceKline1HToken] = useState<Symbol>(Symbol());

  const [priceKline1DSeriesList, setPriceKline1DSeriesList] = useState<PriceKlineSeries[]>([]);
  const [reloadPriceKline1DToken, setReloadPriceKline1DToken] = useState<Symbol>(Symbol());

  useEffect(() => {
    priceDataSource.getAllSymbols().then((result) => {
      result.okThen((symbols) => {
        setAllSymbols(symbols);
      });
    });
  }, [priceDataSource, reloadAllSymbolsToken]);

  const reloadAllSymbols = useCallback(() => {
    setReloadAllSymbolsToken(Symbol());
  }, []);

  useEffect(() => {
    priceDataSource.getAllSymbolCurrentPrices().then((result) => {
      result.okThen((priceNowList) => {
        setPriceNowList(priceNowList);
      });
    });
  }, [priceDataSource, reloadPriceNowToken]);

  const reloadPriceNowList = useCallback(() => {
    setReloadPriceNowToken(Symbol());
  }, []);

  useEffect(() => {
    (async () => {
      const allSymbols = (await priceDataSource.getAllSymbols()).unwrap();
      const klineSeriesList = (
        await priceDataSource.getKline1HourIntervalOfSymbols(allSymbols)
      ).unwrap();
      return klineSeriesList;
    })().then(setPriceKline1HSeriesList);
  }, [priceDataSource, reloadPriceKline1HToken]);

  const reloadPriceKline1HSeriesList = useCallback(() => {
    setReloadPriceKline1HToken(Symbol());
  }, []);

  useEffect(() => {
    (async () => {
      const allSymbols = (await priceDataSource.getAllSymbols()).unwrap();
      const klineSeriesList = (
        await priceDataSource.getKline1DayIntervalOfSymbols(allSymbols)
      ).unwrap();
      return klineSeriesList;
    })().then(setPriceKline1DSeriesList);
  }, [priceDataSource, reloadPriceKline1DToken]);

  const reloadPriceKline1DSeriesList = useCallback(() => {
    setReloadPriceKline1DToken(Symbol());
  }, []);

  return {
    allSymbols,
    priceNowList,
    priceKline1HSeriesList,
    priceKline1DSeriesList,
    reloadAllSymbols,
    reloadPriceNowList,
    reloadPriceKline1HSeriesList,
    reloadPriceKline1DSeriesList,
  };
}
