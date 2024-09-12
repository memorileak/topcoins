//Binance
//[
//  1499040000000, // Kline open time
//  '0.01634790', // Open price
//  '0.80000000', // High price
//  '0.01575800', // Low price
//  '0.01577100', // Close price
//  '148976.11427815', // Volume
//  1499644799999, // Kline Close time
//  '2434.19055334', // Quote asset volume
//  308, // Number of trades
//  '1756.87402397', // Taker buy base asset volume
//  '28.46694368', // Taker buy quote asset volume
//  '0', // Unused field, ignore.
//];

import {Expose, plainToInstance} from 'class-transformer';

export class PriceKline {
  static newForSymbolFromBinance(symbol: string, symbolPrice: Array<number | string>): PriceKline {
    return plainToInstance(
      PriceKline,
      {
        symbol,
        openTime: symbolPrice[0] as number,
        openPrice: parseFloat(symbolPrice[1] as string),
        highPrice: parseFloat(symbolPrice[2] as string),
        lowPrice: parseFloat(symbolPrice[3] as string),
        closePrice: parseFloat(symbolPrice[4] as string),
        volume: parseFloat(symbolPrice[5] as string),
        closeTime: symbolPrice[6] as number,
      },
      {excludeExtraneousValues: true, exposeDefaultValues: true},
    );
  }

  @Expose() symbol: string = '';
  @Expose() openTime: number = 0;
  @Expose() closeTime: number = 0;
  @Expose() volume: number = 0;
  @Expose() openPrice: number = 0;
  @Expose() highPrice: number = 0;
  @Expose() lowPrice: number = 0;
  @Expose() closePrice: number = 0;
}
