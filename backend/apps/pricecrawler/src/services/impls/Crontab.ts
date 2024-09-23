import {Injectable, Logger} from '@nestjs/common';
import {Cron} from '@nestjs/schedule';

import {PriceCrawler} from './PriceCrawler';

@Injectable()
export class Crontab {
  private readonly logger = new Logger(Crontab.name);

  constructor(private readonly priceCrawler: PriceCrawler) {
    this.showError = this.showError.bind(this);
  }

  // Runs every 30 seconds
  @Cron('*/30 * * * * *')
  async runPriceNowCrawling(): Promise<void> {
    this.logger.debug('Running method: runPriceNowCrawling');
    (await this.priceCrawler.crawlLatestDataOfPriceNow()).errThen(this.showError);
  }

  // Runs at 10 seconds past every even-numbered minute (0, 2, 4, ..., 58)
  @Cron('10 0-58/2 * * * *')
  async runCrawlingKline1HourOfCurrentHour(): Promise<void> {
    this.logger.debug('Running method: runCrawlingKline1HourOfCurrentHour');
    (await this.priceCrawler.crawlKlineDataOfCurrentHour()).errThen(this.showError);
  }

  // Runs at 10 seconds past every odd-numbered minute (1, 3, 5, ..., 59)
  @Cron('10 1-59/2 * * * *')
  async runCrawlingKline1DayOfCurrentDay(): Promise<void> {
    this.logger.debug('Running method: runCrawlingKline1DayOfCurrentDay');
    (await this.priceCrawler.crawlKlineDataOfCurrentDay()).errThen(this.showError);
  }

  // Runs at the start of every hour (1 minute past the hour)
  @Cron('0 1 * * * *')
  async runKline1HourCrawling(): Promise<void> {
    this.logger.debug('Running method: runKline1HourCrawling');
    (await this.priceCrawler.crawlLatestDataOfKline1Hour()).errThen(this.showError);
  }

  // Runs at 2 minutes past midnight (00:02) UTC every day
  @Cron('0 2 0 * * *', {timeZone: 'Etc/UTC'})
  async runKline1DayCrawling(): Promise<void> {
    this.logger.debug('Running method: runKline1DayCrawling');
    (await this.priceCrawler.crawlLatestDataOfKline1Day()).errThen(this.showError);
  }

  private showError(err: any): void {
    this.logger.error(err.message || err, err.stack);
  }
}
