import {Injectable, Logger} from '@nestjs/common';
import {Option, Result} from '@topcoins/devkit';

import {EvaluationResult} from '../types/EvaluationResult';
import {PriceChangeCases} from '../types/PriceChangeCases';
import {PriceKline} from '../dtos/PriceKline';
import {PriceNow} from '../dtos/PriceNow';
import {Notification} from '../dtos/Notification';
import {EvaluatorConfig} from './EvaluatorConfig';
import {SqliteDatabase} from './SqliteDatabase';
import {NotificationQueue} from './NotificationQueue';

@Injectable()
export class Evaluator {
  private readonly logger = new Logger(Evaluator.name);
  private trading_signals!: any;

  constructor(
    private readonly evaluatorConfig: EvaluatorConfig,
    private readonly sqliteDatabase: SqliteDatabase,
    private readonly notificationQueue: NotificationQueue,
  ) {
    this.handleError = this.handleError.bind(this);
  }

  initialize(): Promise<Result<void>> {
    return Result.fromExecutionAsync(async () => {
      this.trading_signals = await import('trading-signals');
    });
  }

  evaluateAllSymbols(): Promise<Result<void>> {
    return Result.fromExecutionAsync(async () => {
      const allSymbols = (await this.getAllSymbols()).unwrap();
      const evaluations: EvaluationResult[] = [];
      for (const symbol of allSymbols) {
        const evaluationResult = await this.evaluateSymbol(symbol);
        evaluationResult.errThen(this.handleError);
        evaluationResult.okThen((evaluationOption) => {
          evaluationOption.someThen((evaluation) => {
            if (this.evaluatorConfig.enableNotiForCases.includes(evaluation.priceChangeCase)) {
              evaluations.push(evaluation);
            }
          });
        });
      }
      evaluations.sort((a, b) => this.last(b.latestRSI14) - this.last(a.latestRSI14));
      for (const evaluation of evaluations) {
        this.notificationQueue
          .pushNotification(Notification.newFromEvaluationResult(evaluation))
          .unwrap();
      }
    });
  }

  private getAllSymbols(): Promise<Result<string[]>> {
    return Result.fromExecutionAsync(async () => {
      const rows = await this.sqliteDatabase.query(
        'SELECT DISTINCT symbol FROM price_now ORDER BY symbol ASC;',
      );
      return rows.unwrapOr([]).map((r) => r.symbol as string);
    });
  }

  private getKline15mPricesOfSymbol(symbol: string): Promise<Result<PriceKline[]>> {
    return Result.fromExecutionAsync(async () => {
      const limit = 64;
      const klineDataResult = await this.sqliteDatabase.query(
        'SELECT * FROM price_kline_15m WHERE symbol = ? ORDER BY open_time DESC LIMIT ?;',
        [symbol, limit],
      );
      const klinePrices = klineDataResult
        .unwrapOr([])
        .map((r) => PriceKline.fromSqliteRow(r))
        .reverse();
      const priceNowResult = await this.sqliteDatabase.query(
        'SELECT * FROM price_now WHERE symbol = ?;',
        [symbol],
      );
      const currentPrice = PriceNow.fromSqliteRow(priceNowResult.unwrapOr([])?.[0] ?? {});
      const latestKlinePrice = klinePrices?.[klinePrices.length - 1];

      if (latestKlinePrice && currentPrice) {
        latestKlinePrice.closePrice = currentPrice.price;
      }

      const RSI = this.trading_signals.RSI;
      const rsi14Indexer = new RSI(14);
      for (const klinePrice of klinePrices) {
        rsi14Indexer.update(klinePrice.closePrice);
        klinePrice.rsi14 = Result.fromExecution(() =>
          parseFloat(rsi14Indexer.getResult().toFixed(2)),
        ).unwrapOr(0);
      }

      return klinePrices;
    });
  }

  private evaluateSymbol(symbol: string): Promise<Result<Option<EvaluationResult>>> {
    return Result.fromExecutionAsync(async () => {
      const kline15mPrices = (await this.getKline15mPricesOfSymbol(symbol)).unwrap();
      const latestPrices = kline15mPrices.slice(kline15mPrices.length - 9);
      const latestRSIs = latestPrices.map((p) => p.rsi14);

      const positiveRange: [number, number] = [0, Infinity];
      const negativeRange: [number, number] = [-Infinity, 0];
      let prev = latestPrices[0];
      let rsiInc = 0;
      let rsiDec = 0;
      let direction = 0;

      for (let i = 1; i < latestPrices.length; i += 1) {
        let curr = latestPrices[i];
        let rsiChg = curr.rsi14 - prev.rsi14;
        rsiInc = this.clamp(rsiInc + rsiChg, positiveRange);
        rsiDec = this.clamp(rsiDec + rsiChg, negativeRange);
        direction = rsiChg >= 0 ? 1 : -1;
        prev = curr;
      }

      rsiInc = Math.floor(100 * rsiInc) / 100;
      rsiDec = Math.floor(100 * rsiDec) / 100;

      const rsiChange = direction >= 0 ? rsiInc : rsiDec;

      const latestPrice = latestPrices?.[latestPrices.length - 1]?.closePrice ?? 0;
      const isInWeakZoneLately = latestRSIs.some((rsi) => rsi <= 30);
      if (rsiChange >= this.evaluatorConfig.rsiIncrementThreshold) {
        const priceChangeCase = isInWeakZoneLately
          ? PriceChangeCases.JUMP_FROM_WEAK
          : PriceChangeCases.JUMP;
        return Option.some<EvaluationResult>({
          symbol,
          priceChangeCase,
          rsiChange,
          latestPrice,
          latestRSI14: latestRSIs,
        });
      } else if (rsiChange <= -this.evaluatorConfig.rsiDecrementThreshold) {
        const priceChangeCase = isInWeakZoneLately
          ? PriceChangeCases.DROP_TO_WEAK
          : PriceChangeCases.DROP;
        return Option.some<EvaluationResult>({
          symbol,
          priceChangeCase,
          rsiChange,
          latestPrice,
          latestRSI14: latestRSIs,
        });
      }

      return Option.none();
    });
  }

  private clamp(n: number, domain: [number, number]): number {
    const [min, max] = domain;
    if (n < min) {
      return min;
    } else if (n > max) {
      return max;
    } else {
      return n;
    }
  }

  private last<T>(list: T[]): T {
    return list[list.length - 1];
  }

  private handleError(err: any): void {
    this.logger.error(err.message || err, err.stack);
  }
}
