//Binance
//{
//  "symbol": "BTCUSDT",
//  "price": "56452.00000000"
//}

import {Expose, plainToInstance} from 'class-transformer';

export class PriceNow {
  static newFromBinance(symbolPrice: Record<string, any>): PriceNow {
    return plainToInstance(
      PriceNow,
      {
        symbol: symbolPrice.symbol,
        time: Date.now(),
        price: parseFloat(symbolPrice.price),
      },
      {excludeExtraneousValues: true, exposeDefaultValues: true},
    );
  }

  @Expose() symbol: string = '';
  @Expose() time: number = 0;
  @Expose() price: number = 0;
}
