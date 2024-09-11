import {Option, Result} from '@topcoins/devkit';

import {PriceTrackerConfig} from '../impls/PriceTrackerConfig';
import {PriceEvent} from './PriceEvent';

export class PriceTrackingStatistic {
  static async new(priceTrackerConfig: PriceTrackerConfig): Promise<PriceTrackingStatistic> {
    const priceTrackingStatistic = new PriceTrackingStatistic(priceTrackerConfig);
    await priceTrackingStatistic.initializeTradingSignalsModule();
    return priceTrackingStatistic;
  }

  private readonly priceTrackerConfig: PriceTrackerConfig;
  private rsi14Indexer: any;
  private shouldReplaceLatestRSIPrice: boolean;

  private latestPriceEvent: Option<PriceEvent>;
  private latestRSI14: number;
  private intervalPrices: [number, number][];
  private intervalVelocities: number[];
  private intervalAccelerations: number[];
  private intervalRSI14: number[];

  private constructor(priceTrackerConfig: PriceTrackerConfig) {
    this.priceTrackerConfig = priceTrackerConfig;
    this.rsi14Indexer = null;
    this.shouldReplaceLatestRSIPrice = false;

    this.latestPriceEvent = Option.none();
    this.latestRSI14 = 0;
    this.intervalPrices = [];
    this.intervalVelocities = [];
    this.intervalAccelerations = [];
    this.intervalRSI14 = [];
  }

  private async initializeTradingSignalsModule(): Promise<void> {
    const TradingSignals = await import('trading-signals');
    this.rsi14Indexer = new TradingSignals.RSI(14);
  }

  pushPriceEventAndReCalLatestRSI14(priceEvent: PriceEvent): Result<void> {
    return Result.fromExecution(() => {
      this.latestPriceEvent = Option.some(priceEvent);
      this.latestRSI14 = this.calculateLatestRSI14(priceEvent).unwrap();
    });
  }

  private calculateLatestRSI14(priceEvent: PriceEvent): Result<number> {
    return Result.fromExecution(() => {
      // Update/ReplaceCurrent RSI + set shouldReplaceLatestRSIPrice flag to true
      this.rsi14Indexer.update(priceEvent.price, this.shouldReplaceLatestRSIPrice);
      this.shouldReplaceLatestRSIPrice = true;
      return this.getCurrentRSI14().unwrapOr(0);
    });
  }

  private getCurrentRSI14(): Result<number> {
    return Result.fromExecution(() => parseFloat(this.rsi14Indexer.getResult().toFixed(2)));
  }

  index(): Result<void> {
    return Result.fromExecution(() => {
      this.latestPriceEvent
        .someThen((latestPriceEvent) => {
          this.indexForPriceEvent(latestPriceEvent).unwrap();
        })
        .unwrap()
        .unwrap();
    });
  }

  private indexForPriceEvent(priceEvent: PriceEvent): Result<void> {
    return Result.fromExecution(() => {
      const windowSize = this.priceTrackerConfig.priceTrackingWindowSize;
      const prevPrice = this.intervalPrices[0]?.[0];
      const prevTime = this.intervalPrices[0]?.[1];
      const prevVeloc = this.intervalVelocities[0];
      const currentPrice = priceEvent.price;
      const currentTime = priceEvent.priceTime;

      let currentVeloc = undefined;
      let currentAcclr = undefined;

      if (prevPrice !== undefined && prevTime !== undefined) {
        const dPrice = (1e6 * currentPrice - 1e6 * prevPrice) / prevPrice;
        const dTime = (currentTime - prevTime) / 1e3; // seconds
        currentVeloc = dTime ? this.round(dPrice / dTime).unwrap() : 0;
        if (prevVeloc !== undefined) {
          const dVeloc = currentVeloc - prevVeloc;
          currentAcclr = dTime ? this.round(dVeloc / dTime).unwrap() : 0;
        }
      }

      // Update/ReplaceCurrent RSI + reset shouldReplaceLatestRSIPrice flag
      this.rsi14Indexer.update(currentPrice, this.shouldReplaceLatestRSIPrice);
      this.shouldReplaceLatestRSIPrice = false;
      const currentRSI14 = this.getCurrentRSI14().unwrapOr(0);

      this.intervalPrices.unshift([currentPrice, currentTime]);
      if (currentVeloc !== undefined) {
        this.intervalVelocities.unshift(currentVeloc);
      }
      if (currentAcclr !== undefined) {
        this.intervalAccelerations.unshift(currentAcclr);
      }
      this.intervalRSI14.unshift(currentRSI14);

      if (this.intervalPrices.length > windowSize) {
        this.intervalPrices.pop();
        this.intervalVelocities.pop();
        this.intervalAccelerations.pop();
        this.intervalRSI14.pop();
      }
    });
  }

  private round(num: number): Result<number> {
    return Result.fromExecution(() => Math.round(num * 100) / 100);
  }

  getLatestPrice(): number {
    return this.latestPriceEvent.isSome() ? this.latestPriceEvent.unwrap().price : 0;
  }

  getLatestRSI14(): number {
    return this.latestRSI14;
  }

  getIntervalPrices(): [number, number][] {
    return this.intervalPrices;
  }

  getIntervalVelocities(): number[] {
    return this.intervalVelocities;
  }

  getIntervalAccelerations(): number[] {
    return this.intervalAccelerations;
  }

  getIntervalRSI14(): number[] {
    return this.intervalRSI14;
  }

  toJsonObject(): Record<string, any> {
    return {
      latestPrice: this.getLatestPrice(),
      latestRSI14: this.getLatestRSI14(),
      intervalPrices: this.getIntervalPrices(),
      intervalVelocities: this.getIntervalVelocities(),
      intervalAccelerations: this.getIntervalAccelerations(),
      intervalRSI14: this.getIntervalRSI14(),
    };
  }
}
