/* eslint-disable */
import {format as sql, escapeId} from 'sqlstring';
import {RSI} from 'trading-signals';

import {Result} from '../devkit';
import {DatabaseClient} from './DatabaseClient';

export class PriceNow {
  static fromRaw(raw: Record<string, any>): PriceNow {
    return new PriceNow({
      symbol: raw.symbol,
      time: raw.time,
      price: raw.price,
    });
  }

  private constructor(initData: Record<string, any>) {
    this.symbol = initData.symbol ?? this.symbol;
    this.time = initData.time ?? this.time;
    this.price = initData.price ?? this.price;
  }

  symbol: string = '';
  time: number = 0;
  price: number = 0;
}

export class PriceKline {
  static fromRaw(raw: Record<string, any>): PriceKline {
    return new PriceKline({
      symbol: raw.symbol,
      openTime: raw.open_time,
      closeTime: raw.close_time,
      volume: raw.volume,
      openPrice: raw.open_price,
      highPrice: raw.high_price,
      lowPrice: raw.low_price,
      closePrice: raw.close_price,
    });
  }

  private constructor(initData: Record<string, any>) {
    this.symbol = initData.symbol ?? this.symbol;
    this.openTime = initData.openTime ?? this.openTime;
    this.closeTime = initData.closeTime ?? this.closeTime;
    this.volume = initData.volume ?? this.volume;
    this.openPrice = initData.openPrice ?? this.openPrice;
    this.highPrice = initData.highPrice ?? this.highPrice;
    this.lowPrice = initData.lowPrice ?? this.lowPrice;
    this.closePrice = initData.closePrice ?? this.closePrice;
    this.rsi14 = initData.rsi14 ?? this.rsi14;
  }

  symbol: string = '';
  openTime: number = 0;
  closeTime: number = 0;
  volume: number = 0;
  openPrice: number = 0;
  highPrice: number = 0;
  lowPrice: number = 0;
  closePrice: number = 0;
  rsi14: number = 0;
}

export type PriceKlineSeries = {
  rsi14Indexer: RSI;
  priceKlineData: PriceKline[];
};

export class PriceDataSource {
  private databaseClient: DatabaseClient;

  constructor(opts: any) {
    this.databaseClient = opts.databaseClient;
  }

  getAllSymbols(): Promise<Result<string[]>> {
    return Result.fromExecutionAsync(async () => {
      let result = await this.databaseClient.query(sql('SELECT DISTINCT symbol FROM price_now ORDER BY symbol ASC;'));
      return result.unwrapOr([]).map((r) => r.symbol || '');
    });
  }

  getAllSymbolCurrentPrices(): Promise<Result<PriceNow[]>> {
    return Result.fromExecutionAsync(async () => {
      let result = await this.databaseClient.query(sql('SELECT rowid, * FROM price_now;'));
      return result.unwrapOr([]).map((r) => PriceNow.fromRaw(r));
    });
  }

  getKline1HourIntervalOfSymbol(symbol: string, limit?: number): Promise<Result<PriceKlineSeries>> {
    return this.getKlineDataOfSymbol('price_kline_1h', symbol, limit);
  }

  getKline1DayIntervalOfSymbol(symbol: string, limit?: number): Promise<Result<PriceKlineSeries>> {
    return this.getKlineDataOfSymbol('price_kline_1d', symbol, limit);
  }

  private getKlineDataOfSymbol(
    table: string,
    symbol: string,
    limit?: number,
  ): Promise<Result<PriceKlineSeries>> {
    return Result.fromExecutionAsync(async () => {
      const lim = limit ?? 50;
      let result = await this.databaseClient.query(
        sql(
          `SELECT * FROM ${escapeId(table)} WHERE symbol = ? ORDER BY open_time DESC LIMIT ? OFFSET 1;`,
          [symbol, lim],
        ),
      );
      const priceKlineData = result
        .unwrapOr([])
        .map((r) => PriceKline.fromRaw(r))
        .reverse();
      const rsi14Indexer = new RSI(14);
      for (const pk of priceKlineData) {
        rsi14Indexer.update(pk.closePrice);
        pk.rsi14 = Result.fromExecution(() =>
          parseFloat(rsi14Indexer.getResult().toFixed(2)),
        ).unwrapOr(0);
      }
      return {rsi14Indexer, priceKlineData};
    });
  }
}
