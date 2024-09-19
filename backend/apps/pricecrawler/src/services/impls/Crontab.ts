import {Injectable, Logger} from '@nestjs/common';
import {Cron} from '@nestjs/schedule';

import {PriceCrawler} from './PriceCrawler';

@Injectable()
export class Crontab {
  private readonly logger = new Logger(Crontab.name);

  constructor(private readonly priceCrawler: PriceCrawler) {
    this.showError = this.showError.bind(this);
  }

  @Cron('*/30 * * * * *')
  async runPriceNowCrawling(): Promise<void> {
    this.logger.debug('Running method: runPriceNowCrawling');
    (await this.priceCrawler.crawlLatestDataOfPriceNow()).errThen(this.showError);
  }

  @Cron('10 0-58/2 * * * *')
  async runCrawlingKline1HourOfCurrentHour(): Promise<void> {
    this.logger.debug('Running method: runCrawlingKline1HourOfCurrentHour');
    (await this.priceCrawler.crawlKlineDataOfCurrentHour()).errThen(this.showError);
  }

  @Cron('10 1-59/2 * * * *')
  async runCrawlingKline1DayOfCurrentDay(): Promise<void> {
    this.logger.debug('Running method: runCrawlingKline1DayOfCurrentDay');
    (await this.priceCrawler.crawlKlineDataOfCurrentDay()).errThen(this.showError);
  }

  @Cron('0 1 * * * *')
  async runKline1HourCrawling(): Promise<void> {
    this.logger.debug('Running method: runKline1HourCrawling');
    (await this.priceCrawler.crawlLatestDataOfKline1Hour()).errThen(this.showError);
  }

  @Cron('0 2 0 * * *', {timeZone: 'Etc/UTC'})
  async runKline1DayCrawling(): Promise<void> {
    this.logger.debug('Running method: runKline1DayCrawling');
    (await this.priceCrawler.crawlLatestDataOfKline1Day()).errThen(this.showError);
  }

  private showError(err: any): void {
    this.logger.error(err.message || err, err.stack);
  }
}
