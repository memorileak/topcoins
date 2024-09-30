import {Expose, plainToInstance} from 'class-transformer';

export class PriceKline {
  static fromSqliteRow(row: Record<string, any>): PriceKline {
    return plainToInstance(
      PriceKline,
      {
        symbol: row.symbol ?? '',
        openTime: row.open_time ?? 0,
        openPrice: row.open_price ?? 0,
        highPrice: row.high_price ?? 0,
        lowPrice: row.low_price ?? 0,
        closePrice: row.close_price ?? 0,
        baseVol: row.base_vol ?? 0,
        closeTime: row.close_time ?? 0,
        quotVol: row.quot_vol ?? 0,
        trades: row.trades ?? 0,
        takerBuyBaseVol: row.taker_buy_base_vol ?? 0,
        takerBuyQuotVol: row.taker_buy_quot_vol ?? 0,
        rsi14: 0,
      },
      {excludeExtraneousValues: true, exposeDefaultValues: true},
    );
  }

  @Expose() symbol: string = '';
  @Expose() openTime: number = 0;
  @Expose() closeTime: number = 0;
  @Expose() baseVol: number = 0;
  @Expose() quotVol: number = 0;
  @Expose() trades: number = 0;
  @Expose() takerBuyBaseVol: number = 0;
  @Expose() takerBuyQuotVol: number = 0;
  @Expose() openPrice: number = 0;
  @Expose() highPrice: number = 0;
  @Expose() lowPrice: number = 0;
  @Expose() closePrice: number = 0;
  @Expose() rsi14: number = 0;
}
