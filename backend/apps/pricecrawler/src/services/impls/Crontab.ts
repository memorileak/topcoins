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

  // Runs every 3 minutes, at 10 seconds past the minute
  @Cron('10 */3 * * * *')
  async runCrawlingKline15MinutesOfCurrent15Minutes(): Promise<void> {
    this.logger.debug('Running method: runCrawlingKline15MinutesOfCurrent15Minutes');
    (await this.priceCrawler.crawlKlineDataOfCurrent15Minutes()).errThen(this.showError);
  }

  // Runs every 3 minutes, at 70 seconds past the minute (1 minute and 10 seconds)
  @Cron('10 1-58/3 * * * *')
  async runCrawlingKline1HourOfCurrentHour(): Promise<void> {
    this.logger.debug('Running method: runCrawlingKline1HourOfCurrentHour');
    (await this.priceCrawler.crawlKlineDataOfCurrentHour()).errThen(this.showError);
  }

  // Runs every 3 minutes, at 130 seconds past the minute (2 minutes and 10 seconds)
  @Cron('10 2-59/3 * * * *')
  async runCrawlingKline1DayOfCurrentDay(): Promise<void> {
    this.logger.debug('Running method: runCrawlingKline1DayOfCurrentDay');
    (await this.priceCrawler.crawlKlineDataOfCurrentDay()).errThen(this.showError);
  }

  // Runs every 15 minutes, at 5 seconds past the minute
  @Cron('5 */15 * * * *')
  async runKline15MinutesCrawling(): Promise<void> {
    this.logger.debug('Running method: runKline15MinutesCrawling');
    (await this.priceCrawler.crawlLatestDataOfKline15Minutes()).errThen(this.showError);
  }

  // Runs at 1 minute past every hour
  @Cron('1 * * * *')
  async runKline1HourCrawling(): Promise<void> {
    this.logger.debug('Running method: runKline1HourCrawling');
    (await this.priceCrawler.crawlLatestDataOfKline1Hour()).errThen(this.showError);
  }

  // Runs at 2 minutes past midnight (00:02) UTC every day
  @Cron('2 0 * * *', {timeZone: 'Etc/UTC'})
  async runKline1DayCrawling(): Promise<void> {
    this.logger.debug('Running method: runKline1DayCrawling');
    (await this.priceCrawler.crawlLatestDataOfKline1Day()).errThen(this.showError);
  }

  private showError(err: any): void {
    this.logger.error(err.message || err, err.stack);
  }
}
