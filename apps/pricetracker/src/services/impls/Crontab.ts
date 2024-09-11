import {Injectable, Logger} from '@nestjs/common';
import {Cron, CronExpression} from '@nestjs/schedule';
import {Result} from '@topcoins/devkit';

import {BinanceStreamConsumer} from './BinanceStreamConsumer';
import {PriceTracker} from './PriceTracker';

@Injectable()
export class Crontab {
  private readonly logger = new Logger(Crontab.name);

  constructor(
    private readonly binanceStreamConsumer: BinanceStreamConsumer,
    private readonly priceTracker: PriceTracker,
  ) {}

  @Cron('0 */15 * * * *')
  runPriceTrackerIndexing(): void {
    const result = this.priceTracker.index();
    result.okThen(() => this.logger.debug('Price tracking index updated'));
    result.errThen((err: any) => this.logger.error(err.message || err, err.stack));
  }

  @Cron('2 2 * * * *')
  async refreshBinanceStreamConnection(): Promise<void> {
    this.logger.log('Binance stream connection refreshing...');
    let result: Result<any> = await this.binanceStreamConsumer.terminateConnection();
    result = await result.okThenAsync(async () =>
      (await this.binanceStreamConsumer.setupNewConnection()).unwrap(),
    );
    result.errThen((err: any) => this.logger.error(err.message || err, err.stack));
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async respawnBinanceStreamConnection(): Promise<void> {
    if (!this.binanceStreamConsumer.isConnectionAlive()) {
      this.logger.log('Binance stream connection respawning...');
      let result = await this.binanceStreamConsumer.setupNewConnection();
      result.errThen((err: any) => this.logger.error(err.message || err, err.stack));
    }
  }
}
