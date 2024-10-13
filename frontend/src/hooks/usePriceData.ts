import {useCallback, useEffect, useState} from 'react';
import * as TE from 'fp-ts/TaskEither';
import {pipe} from 'fp-ts/function';
import {map} from 'fp-ts/Either';

import {inject, Services} from '../services/injection';
import {PriceDataSource, PriceKlineSeries, PriceNow} from '../services/PriceDataSource';

type PriceData = {
  allSymbols: string[];
  priceNowList: PriceNow[];
  priceKline15mSeriesList: PriceKlineSeries[];
  priceKline1HSeriesList: PriceKlineSeries[];
  priceKline1DSeriesList: PriceKlineSeries[];
  reloadAllSymbols: () => void;
  reloadPriceNowList: () => void;
  reloadPriceKline15mSeriesList: () => void;
  reloadPriceKline1HSeriesList: () => void;
  reloadPriceKline1DSeriesList: () => void;
};

export function usePriceData(): PriceData {
  const priceDataSource = inject<PriceDataSource>(Services.PriceDataSource);

  const [allSymbols, setAllSymbols] = useState<string[]>([]);
  const [reloadAllSymbolsToken, setReloadAllSymbolsToken] = useState<Symbol>(Symbol());

  const [priceNowList, setPriceNowList] = useState<PriceNow[]>([]);
  const [reloadPriceNowToken, setReloadPriceNowToken] = useState<Symbol>(Symbol());

  const [priceKline15mSeriesList, setPriceKline15mSeriesList] = useState<PriceKlineSeries[]>([]);
  const [reloadPriceKline15mToken, setReloadPriceKline15mToken] = useState<Symbol>(Symbol());

  const [priceKline1HSeriesList, setPriceKline1HSeriesList] = useState<PriceKlineSeries[]>([]);
  const [reloadPriceKline1HToken, setReloadPriceKline1HToken] = useState<Symbol>(Symbol());

  const [priceKline1DSeriesList, setPriceKline1DSeriesList] = useState<PriceKlineSeries[]>([]);
  const [reloadPriceKline1DToken, setReloadPriceKline1DToken] = useState<Symbol>(Symbol());

  useEffect(() => {
    priceDataSource.getAllSymbols().then((either) => {
      map<string[], void>((symbols) => setAllSymbols(symbols))(either);
    });
  }, [priceDataSource, reloadAllSymbolsToken]);

  const reloadAllSymbols = useCallback(() => {
    setReloadAllSymbolsToken(Symbol());
  }, []);

  useEffect(() => {
    priceDataSource.getAllSymbolCurrentPrices().then((either) => {
      map<PriceNow[], void>((priceNowList) => setPriceNowList(priceNowList))(either);
    });
  }, [priceDataSource, reloadPriceNowToken]);

  const reloadPriceNowList = useCallback(() => {
    setReloadPriceNowToken(Symbol());
  }, []);

  useEffect(() => {
    (async () => {
      await pipe(
        () => priceDataSource.getAllSymbols(),
        TE.flatMap<string[], unknown, PriceKlineSeries[]>(
          (symbols) => () => priceDataSource.getKline15MinutesIntervalOfSymbols(symbols),
        ),
        TE.map<PriceKlineSeries[], void>(setPriceKline15mSeriesList),
      )();
    })();
  }, [priceDataSource, reloadPriceKline15mToken]);

  const reloadPriceKline15mSeriesList = useCallback(() => {
    setReloadPriceKline15mToken(Symbol());
  }, []);

  useEffect(() => {
    (async () => {
      await pipe(
        () => priceDataSource.getAllSymbols(),
        TE.flatMap<string[], unknown, PriceKlineSeries[]>(
          (symbols) => () => priceDataSource.getKline1HourIntervalOfSymbols(symbols),
        ),
        TE.map<PriceKlineSeries[], void>(setPriceKline1HSeriesList),
      )();
    })();
  }, [priceDataSource, reloadPriceKline1HToken]);

  const reloadPriceKline1HSeriesList = useCallback(() => {
    setReloadPriceKline1HToken(Symbol());
  }, []);

  useEffect(() => {
    (async () => {
      await pipe(
        () => priceDataSource.getAllSymbols(),
        TE.flatMap<string[], unknown, PriceKlineSeries[]>(
          (symbols) => () => priceDataSource.getKline1DayIntervalOfSymbols(symbols, 118),
        ),
        TE.map<PriceKlineSeries[], void>(setPriceKline1DSeriesList),
      )();
    })();
  }, [priceDataSource, reloadPriceKline1DToken]);

  const reloadPriceKline1DSeriesList = useCallback(() => {
    setReloadPriceKline1DToken(Symbol());
  }, []);

  return {
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
  };
}
