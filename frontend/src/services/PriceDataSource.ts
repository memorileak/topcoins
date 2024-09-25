/* eslint-disable */
import {format as sql, escapeId} from 'sqlstring';
import {RSI} from 'trading-signals';

import {Option, Result} from '../devkit';
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
      baseVol: raw.base_vol,
      quotVol: raw.quot_vol,
      trades: raw.trades,
      takerBuyBaseVol: raw.taker_buy_base_vol,
      takerBuyQuotVol: raw.taker_buy_quot_vol,
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
    this.baseVol = initData.baseVol ?? this.baseVol;
    this.quotVol = initData.quotVol ?? this.quotVol;
    this.trades = initData.trades ?? this.trades;
    this.takerBuyBaseVol = initData.takerBuyBaseVol ?? this.takerBuyBaseVol;
    this.takerBuyQuotVol = initData.takerBuyQuotVol ?? this.takerBuyQuotVol;
    this.openPrice = initData.openPrice ?? this.openPrice;
    this.highPrice = initData.highPrice ?? this.highPrice;
    this.lowPrice = initData.lowPrice ?? this.lowPrice;
    this.closePrice = initData.closePrice ?? this.closePrice;
    this.rsi14 = initData.rsi14 ?? this.rsi14;
    this.rsi14Min = initData.rsi14Min ?? this.rsi14Min;
    this.rsi14Max = initData.rsi14Max ?? this.rsi14Max;
  }

  symbol: string = '';
  openTime: number = 0;
  closeTime: number = 0;
  baseVol: number = 0;
  quotVol: number = 0;
  trades: number = 0;
  takerBuyBaseVol: number = 0;
  takerBuyQuotVol: number = 0;
  openPrice: number = 0;
  highPrice: number = 0;
  lowPrice: number = 0;
  closePrice: number = 0;
  rsi14: number = 0;
  rsi14Min: number = 0;
  rsi14Max: number = 0;
}

export type PriceKlineSeries = {
  symbol: string;
  rsi14Indexer: RSI;
  priceKlineData: PriceKline[];
};

export class PriceDataSource {
  private databaseClient: DatabaseClient;
  private cachedAllSymbols: Option<string[]>;

  constructor(opts: any) {
    this.databaseClient = opts.databaseClient;
    this.cachedAllSymbols = Option.none();
  }

  getAllSymbols(): Promise<Result<string[]>> {
    return Result.fromExecutionAsync(async () => {
      if (this.cachedAllSymbols.isNone()) {
        let result = await this.databaseClient.query(
          sql('SELECT DISTINCT symbol FROM price_now ORDER BY symbol ASC;'),
        );
        result.okThen((rows) => {
          this.cachedAllSymbols = Option.some(rows.map((r) => r.symbol || ''));
        });
      }
      return this.cachedAllSymbols.unwrapOr([]);
    });
  }

  getAllSymbolCurrentPrices(): Promise<Result<PriceNow[]>> {
    return Result.fromExecutionAsync(async () => {
      let result = await this.databaseClient.query(sql('SELECT rowid, * FROM price_now;'));
      return result.unwrapOr([]).map((r) => PriceNow.fromRaw(r));
    });
  }

  getKline15MinutesIntervalOfSymbols(
    symbols: string[],
    limit?: number,
  ): Promise<Result<PriceKlineSeries[]>> {
    return this.getKlineDataOfSymbols('price_kline_15m', symbols, limit);
  }

  getKline1HourIntervalOfSymbols(
    symbols: string[],
    limit?: number,
  ): Promise<Result<PriceKlineSeries[]>> {
    return this.getKlineDataOfSymbols('price_kline_1h', symbols, limit);
  }

  getKline1DayIntervalOfSymbols(
    symbols: string[],
    limit?: number,
  ): Promise<Result<PriceKlineSeries[]>> {
    return this.getKlineDataOfSymbols('price_kline_1d', symbols, limit);
  }

  private getKlineDataOfSymbols(
    table: string,
    symbols: string[],
    limit?: number,
  ): Promise<Result<PriceKlineSeries[]>> {
    return Result.fromExecutionAsync(async () => {
      const lim = limit ?? 64;
      const queries = symbols.map((symbol) =>
        sql(`SELECT * FROM ${escapeId(table)} WHERE symbol = ? ORDER BY open_time DESC LIMIT ?;`, [
          symbol,
          lim,
        ]),
      );

      const result = await this.databaseClient.query(queries);
      const priceKlineSeriesListRaw = result.unwrapOr([]);
      const priceKlineSeriesList: PriceKlineSeries[] = [];

      for (let i = 0; i < priceKlineSeriesListRaw.length; i += 1) {
        const priceKlineDataRaw = priceKlineSeriesListRaw[i];
        const priceKlineData = priceKlineDataRaw.map((r) => PriceKline.fromRaw(r)).reverse();
        const symbol = symbols[i];
        const rsi14Indexer = new RSI(14);
        for (const pk of priceKlineData) {
          rsi14Indexer.update(pk.lowPrice);
          pk.rsi14Min = Result.fromExecution(() =>
            parseFloat(rsi14Indexer.getResult().toFixed(2)),
          ).unwrapOr(0);
          rsi14Indexer.replace(pk.highPrice);
          pk.rsi14Max = Result.fromExecution(() =>
            parseFloat(rsi14Indexer.getResult().toFixed(2)),
          ).unwrapOr(0);
          rsi14Indexer.replace(pk.closePrice);
          pk.rsi14 = Result.fromExecution(() =>
            parseFloat(rsi14Indexer.getResult().toFixed(2)),
          ).unwrapOr(0);
        }
        priceKlineSeriesList.push({symbol, rsi14Indexer, priceKlineData});
      }

      return priceKlineSeriesList;
    });
  }
}
