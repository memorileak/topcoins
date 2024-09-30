import {PriceChangeCases} from './PriceChangeCases';

export type EvaluationResult = {
  symbol: string;
  priceChangeCase: PriceChangeCases;
  rsiChange: number;
  latestPrice: number;
  latestRSI14: number[];
};
