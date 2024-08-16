import {Option, Result} from '@trinance/devkit';

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

  private lastPriceEvent: Option<PriceEvent>;
  private intervalPrices: [number, number][];
  private intervalVelocities: number[];
  private intervalAccelerations: number[];
  private intervalRSI14: number[];

  private constructor(priceTrackerConfig: PriceTrackerConfig) {
    this.priceTrackerConfig = priceTrackerConfig;
    this.lastPriceEvent = Option.none();
    this.intervalPrices = [];
    this.intervalVelocities = [];
    this.intervalAccelerations = [];
    this.intervalRSI14 = [];
  }

  private async initializeTradingSignalsModule(): Promise<void> {
    const TradingSignals = await import('trading-signals');
    this.rsi14Indexer = new TradingSignals.RSI(14);
  }

  pushPriceEvent(priceEvent: PriceEvent): Result<void> {
    return Result.fromExecution(() => {
      this.lastPriceEvent = Option.some(priceEvent);
    });
  }

  index(): Result<void> {
    return Result.fromExecution(() => {
      this.lastPriceEvent
        .someThen((lastPriceEvent) => {
          this.indexForPriceEvent(lastPriceEvent).unwrap();
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

      this.rsi14Indexer.update(currentPrice);
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

  private getCurrentRSI14(): Result<number> {
    return Result.fromExecution(() => parseFloat(this.rsi14Indexer.getResult().toFixed(2)));
  }

  getLastestPrice(): number {
    return this.lastPriceEvent.isSome() ? this.lastPriceEvent.unwrap().price : 0;
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
      latestPrice: this.getLastestPrice(),
      intervalPrices: this.getIntervalPrices(),
      intervalVelocities: this.getIntervalVelocities(),
      intervalAccelerations: this.getIntervalAccelerations(),
      intervalRSI14: this.getIntervalRSI14(),
    };
  }
}
