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

  private async ingestPriceEvents(): Promise<void> {
    while (true) {
      const messageOption = this.binanceStreamConsumer.getMessage();
      if (messageOption.isSome()) {
        const message = messageOption.unwrap();
        if (Array.isArray(message.data)) {
          for (const e of message.data) {
            const result = await PriceEvent.tryFromRawEvent(e).okThenAsync(async (priceEvent) => {
              if (/USDT$/.test(priceEvent.symbol)) {
                if (!this.mapSymbolStatistic.has(priceEvent.symbol)) {
                  this.mapSymbolStatistic.set(
                    priceEvent.symbol,
                    await PriceTrackingStatistic.new(this.priceTrackerConfig),
                  );
                }
                this.mapSymbolStatistic
                  .get(priceEvent.symbol)
                  .pushPriceEventAndReCalLatestRSI14(priceEvent)
                  .unwrap();
              }
            });
            result.errThen((err: any) => this.logger.error(err.message || err, err.stack));
          }
        }
      } else {
        this.logger.debug('No messages from stream, waiting...');
        await this.delaySecs(5);
      }
    }
  }

  index(): Result<void> {
    return Result.fromExecution(() => {
      for (const [, statistic] of this.mapSymbolStatistic) {
        statistic.index().unwrap();
      }
    });
  }

  start(): Promise<void> {
    return this.ingestPriceEvents();
  }

  getTopTokens(): Result<Record<string, any>[]> {
    return Result.fromExecution(() => {
      let topTokens: Record<string, any>[] = [];
      for (const [symbol, statistic] of this.mapSymbolStatistic) {
        if (
          statistic
            .getIntervalVelocities()
            .slice(0, 4)
            .reduce((c, n) => c + n, 0) !== 0
        ) {
          const statisticJsonObject = statistic.toJsonObject();
          topTokens.push({...statisticJsonObject, symbol});
        }
      }
      topTokens = topTokens
        .sort((a, b) => (a.latestRSI14 || Infinity) - (b.latestRSI14 || Infinity))
        .slice(0, this.priceTrackerConfig.topTokensListSize);
      return topTokens;
    });
  }
}
