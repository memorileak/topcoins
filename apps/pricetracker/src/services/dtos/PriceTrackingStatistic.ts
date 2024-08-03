import {Option, Result} from '@trinance/devkit';

import {PriceTrackerConfig} from '../impls/PriceTrackerConfig';
import {PriceEvent} from './PriceEvent';

export class PriceTrackingStatistic {
  static new(priceTrackerConfig: PriceTrackerConfig): PriceTrackingStatistic {
    return new PriceTrackingStatistic(priceTrackerConfig);
  }

  private readonly priceTrackerConfig: PriceTrackerConfig;

  private lastPriceEvent: Option<PriceEvent>;
  private intervalPrices: [number, number][];
  private intervalVelocities: number[];
  private intervalAccelerations: number[];

  private constructor(priceTrackerConfig: PriceTrackerConfig) {
    this.priceTrackerConfig = priceTrackerConfig;
    this.lastPriceEvent = Option.none();
    this.intervalPrices = [];
    this.intervalVelocities = [];
    this.intervalAccelerations = [];
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

      this.intervalPrices.unshift([currentPrice, currentTime]);
      if (currentVeloc !== undefined) {
        this.intervalVelocities.unshift(currentVeloc);
      }
      if (currentAcclr !== undefined) {
        this.intervalAccelerations.unshift(currentAcclr);
      }

      if (this.intervalPrices.length > windowSize) {
        this.intervalPrices.pop();
        this.intervalVelocities.pop();
        this.intervalAccelerations.pop();
      }
    });
  }

  private round(num: number): Result<number> {
    return Result.fromExecution(() => Math.round(num * 100) / 100);
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

  toJsonObject(): Record<string, any> {
    return {
      latestPrice: this.getLastestPrice(),
      intervalPrices: this.getIntervalPrices(),
      intervalVelocities: this.getIntervalVelocities(),
      intervalAccelerations: this.getIntervalAccelerations(),
    };
  }
}
