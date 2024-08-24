import {Injectable, Logger} from '@nestjs/common';
import {Cron} from '@nestjs/schedule';

import {PriceTracker} from './PriceTracker';

@Injectable()
export class Crontab {
  private readonly logger = new Logger(Crontab.name);

  constructor(private readonly priceTracker: PriceTracker) {}

  @Cron('0 */15 * * * *')
  runPriceTrackerIndexing(): void {
    const result = this.priceTracker.index();
    result.okThen(() => this.logger.debug('Price tracking index updated!'));
    result.errThen((err: any) => this.logger.error(err.message || err, err.stack));
  }
}
