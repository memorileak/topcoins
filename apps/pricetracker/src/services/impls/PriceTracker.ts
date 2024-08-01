import {Injectable, Logger} from '@nestjs/common';
import {Result} from '@trinance/devkit';

import {PriceEvent} from '../dtos/PriceEvent';
import {PriceTrackingStatistic} from '../dtos/PriceTrackingStatistic';
import {PriceTrackerConfig} from './PriceTrackerConfig';
import {BinanceStreamConsumer} from './BinanceStreamConsumer';

@Injectable()
export class PriceTracker {
  private readonly logger = new Logger(PriceTracker.name);

  private mapSymbolStatistic: Map<string, PriceTrackingStatistic>;

  constructor(
    private readonly priceTrackerConfig: PriceTrackerConfig,
    private readonly binanceStreamConsumer: BinanceStreamConsumer,
  ) {
    this.mapSymbolStatistic = new Map();
  }

  private delaySecs(seconds: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, seconds * 1000);
    });
  }

  async ingestPriceEvents(): Promise<void> {
    this.binanceStreamConsumer.setup();
    while (true) {
      const messageOption = this.binanceStreamConsumer.getMessage();
      if (messageOption.isSome()) {
        const message = messageOption.unwrap();
        if (Array.isArray(message.data)) {
          for (const e of message.data) {
            PriceEvent.tryFromRawEvent(e).okThen((priceEvent) => {
              if (/USDT$/.test(priceEvent.symbol)) {
                if (!this.mapSymbolStatistic.has(priceEvent.symbol)) {
                  this.mapSymbolStatistic.set(
                    priceEvent.symbol,
                    PriceTrackingStatistic.new(this.priceTrackerConfig),
                  );
                }
                this.mapSymbolStatistic.get(priceEvent.symbol).pushPriceEvent(priceEvent).unwrap();
              }
            });
          }
        }
      } else {
        this.logger.debug('No messages from stream, waiting...');
        await this.delaySecs(5);
      }
    }
  }

  async indexIntervally(): Promise<void> {
    while (true) {
      for (const [, statistic] of this.mapSymbolStatistic) {
        statistic.index().unwrap();
      }
      await this.delaySecs(this.priceTrackerConfig.priceTrackingIntervalSecs);
    }
  }

  //topVelocThroughTime: Array<Record<string, any>> = [];
  //async debug(): Promise<void> {
  //  while (true) {
  //    const statisticData: Record<string, any> = {};
  //    let topVeloc: Array<Record<string, any>> = [];
  //
  //    for (const [symbol, statistic] of this.mapSymbolStatistic) {
  //      const statisticJsonObject = statistic.toJsonObject();
  //      statisticData[symbol] = statisticJsonObject;
  //      topVeloc.push({...statisticJsonObject, symbol});
  //    }
  //
  //    topVeloc = topVeloc
  //      .sort(
  //        (a, b) => (b.intervalVelocities[0] || -Infinity) - (a.intervalVelocities[0] || -Infinity),
  //      )
  //      .slice(0, 20);
  //
  //    this.topVelocThroughTime.push({time: new Date().toISOString(), topVeloc});
  //
  //    await writeFile('./statistic-data.json', JSON.stringify(statisticData, null, 2));
  //    await writeFile(
  //      './top-veloc-through-time.json',
  //      JSON.stringify(this.topVelocThroughTime, null, 2),
  //    );
  //    this.logger.log('Statistic data file updated.');
  //    await this.delaySecs(this.priceTrackerConfig.priceTrackingIntervalSecs);
  //  }
  //}

  async start(): Promise<void[]> {
    return Promise.all([this.ingestPriceEvents(), this.indexIntervally()]);
  }

  getTopTokens(): Result<Record<string, any>[]> {
    return Result.fromExecution(() => {
      let topTokens: Record<string, any>[] = [];
      for (const [symbol, statistic] of this.mapSymbolStatistic) {
        const statisticJsonObject = statistic.toJsonObject();
        topTokens.push({...statisticJsonObject, symbol});
      }
      topTokens = topTokens
        .sort(
          (a, b) => (b.intervalVelocities[0] || -Infinity) - (a.intervalVelocities[0] || -Infinity),
        )
        .slice(0, 50);
      return topTokens;
    });
  }
}
