import {useCallback, useEffect, useState, createContext, useContext} from 'react';

import {inject, Services} from '../services/injection';
import {PriceDataSource} from '../services/PriceDataSource';

function isEmptyObject(obj: object): boolean {
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      return false;
    }
  }
  return true;
}

function isAllFalsyObject(obj: object): boolean {
  for (const prop in obj) {
    if ((obj as any)[prop]) {
      return false;
    }
  }
  return true;
}

type SelectedSymbolsData = {
  selectedSymbols: Record<string, boolean>;
  handleToggleSymbol: (symbol: string) => void;
};

export function useSelectedSymbols(): SelectedSymbolsData {
  const priceDataSource = inject<PriceDataSource>(Services.PriceDataSource);

  const [allSymbols, setAllSymbols] = useState<string[]>([]);
  useEffect(() => {
    priceDataSource.getAllSymbols().then((result) => {
      result.okThen((symbols) => {
        setAllSymbols(symbols);
      });
    });
  }, [priceDataSource]);

  const [selectedSymbols, setSelectedSymbols] = useState<Record<string, boolean>>({});
  const handleToggleSymbol = useCallback(
    (symbol: string) => {
      const newSelectedSymbols = {...selectedSymbols};
      if (selectedSymbols[symbol]) {
        newSelectedSymbols[symbol] = false;
        if (isAllFalsyObject(newSelectedSymbols)) {
          for (let s in newSelectedSymbols) {
            delete newSelectedSymbols[s];
          }
        }
      } else {
        if (isEmptyObject(newSelectedSymbols)) {
          for (const s of allSymbols) {
            newSelectedSymbols[s] = false;
          }
        }
        newSelectedSymbols[symbol] = true;
      }
      setSelectedSymbols(newSelectedSymbols);
    },
    [allSymbols, selectedSymbols],
  );

  return {selectedSymbols, handleToggleSymbol};
}

export const SelectedSymbolsContext = createContext<SelectedSymbolsData>({
  selectedSymbols: {},
  handleToggleSymbol: () => {},
});

export const useSelectedSymbolsContext = () => useContext(SelectedSymbolsContext);
