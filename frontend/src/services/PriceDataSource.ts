/* eslint-disable */
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import {Option} from 'fp-ts/Option';
import {Either, right, map, orElse, getOrElse, tryCatch, match} from 'fp-ts/Either';
import {format as sql, escapeId} from 'sqlstring';
import {RSI} from 'trading-signals';

import {DatabaseClient, QueryOutput} from './DatabaseClient';

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
    this.cachedAllSymbols = O.none;
    this.showAndReturnError = this.showAndReturnError.bind(this);
    this.ignoreAndReturnError = this.ignoreAndReturnError.bind(this);
  }

  async getAllSymbols(): Promise<Either<unknown, string[]>> {
    if (O.isNone(this.cachedAllSymbols)) {
      pipe(
        await this.databaseClient.query(
          sql('SELECT DISTINCT symbol FROM price_now ORDER BY symbol ASC;'),
        ),
        map<QueryOutput, void>((rows) => {
          this.cachedAllSymbols = O.some(rows.map((r) => r.symbol || ''));
        }),
        match(this.showAndReturnError, () => {}),
      );
    }
    return right(O.getOrElse<string[]>(() => [])(this.cachedAllSymbols));
  }

  async getAllSymbolCurrentPrices(): Promise<Either<unknown, PriceNow[]>> {
    return pipe(
      await this.databaseClient.query(
        sql('SELECT DISTINCT symbol FROM price_now ORDER BY symbol ASC;'),
      ),
      map<QueryOutput, PriceNow[]>((rows) => rows.map((r) => PriceNow.fromRaw(r))),
      orElse<unknown, PriceNow[], unknown>(() => right([])),
    );
  }

  getKline15MinutesIntervalOfSymbols(
    symbols: string[],
    limit?: number,
  ): Promise<Either<unknown, PriceKlineSeries[]>> {
    return this.getKlineDataOfSymbols('price_kline_15m', symbols, limit);
  }

  getKline1HourIntervalOfSymbols(
    symbols: string[],
    limit?: number,
  ): Promise<Either<unknown, PriceKlineSeries[]>> {
    return this.getKlineDataOfSymbols('price_kline_1h', symbols, limit);
  }

  getKline1DayIntervalOfSymbols(
    symbols: string[],
    limit?: number,
  ): Promise<Either<unknown, PriceKlineSeries[]>> {
    return this.getKlineDataOfSymbols('price_kline_1d', symbols, limit);
  }

  private getKlineDataOfSymbols(
    table: string,
    symbols: string[],
    limit?: number,
  ): Promise<Either<unknown, PriceKlineSeries[]>> {
    return TE.tryCatch<unknown, PriceKlineSeries[]>(async () => {
      const lim = limit ?? 64;
      const queries = symbols.map((symbol) =>
        sql(`SELECT * FROM ${escapeId(table)} WHERE symbol = ? ORDER BY open_time DESC LIMIT ?;`, [
          symbol,
          lim,
        ]),
      );

      const either = await this.databaseClient.query(queries);
      const priceKlineSeriesListRaw = getOrElse<unknown, QueryOutput[]>(() => [])(either);
      const priceKlineSeriesList: PriceKlineSeries[] = [];

      for (let i = 0; i < priceKlineSeriesListRaw.length; i += 1) {
        const priceKlineDataRaw = priceKlineSeriesListRaw[i];
        const priceKlineData = priceKlineDataRaw.map((r) => PriceKline.fromRaw(r)).reverse();
        const symbol = symbols[i];
        const rsi14Indexer = new RSI(14);
        for (const pk of priceKlineData) {
          rsi14Indexer.update(pk.lowPrice);
          pk.rsi14Min = getOrElse<unknown, number>(() => 0)(
            tryCatch(
              () => parseFloat(rsi14Indexer.getResult().toFixed(2)),
              this.ignoreAndReturnError,
            ),
          );
          rsi14Indexer.replace(pk.highPrice);
          pk.rsi14Max = getOrElse<unknown, number>(() => 0)(
            tryCatch<unknown, number>(
              () => parseFloat(rsi14Indexer.getResult().toFixed(2)),
              this.ignoreAndReturnError,
            ),
          );
          rsi14Indexer.replace(pk.closePrice);
          pk.rsi14 = getOrElse<unknown, number>(() => 0)(
            tryCatch<unknown, number>(
              () => parseFloat(rsi14Indexer.getResult().toFixed(2)),
              this.ignoreAndReturnError,
            ),
          );
        }
        priceKlineSeriesList.push({symbol, rsi14Indexer, priceKlineData});
      }

      return priceKlineSeriesList;
    }, this.showAndReturnError)();
  }

  private showAndReturnError(err: any): unknown {
    console.error(err);
    return err;
  }

  private ignoreAndReturnError(err: any): unknown {
    return err;
  }
}
