import {Injectable, Logger} from '@nestjs/common';
import {Cron} from '@nestjs/schedule';

import {PriceCrawler} from './PriceCrawler';

@Injectable()
export class Crontab {
  private readonly logger = new Logger(Crontab.name);

  constructor(private readonly priceCrawler: PriceCrawler) {
    this.showError = this.showError.bind(this);
  }

  // Runs every 15 seconds to fetch the most up-to-date price information
  @Cron('*/15 * * * * *')
  async runPriceNowCrawling(): Promise<void> {
    this.logger.debug('Running method: runPriceNowCrawling');
    (await this.priceCrawler.crawlLatestDataOfPriceNow()).errThen(this.showError);
  }

  // Runs every minute, at 10 seconds past the minute, to update the current 15-minute kline data
  @Cron('10 * * * * *')
  async runCrawlingKline15MinutesOfCurrent15Minutes(): Promise<void> {
    this.logger.debug('Running method: runCrawlingKline15MinutesOfCurrent15Minutes');
    (await this.priceCrawler.crawlKlineDataOfCurrent15Minutes()).errThen(this.showError);
  }

  // Runs every even minute, at 20 seconds past the minute, to update the current 1-hour kline data
  @Cron('20 0-58/2 * * * *')
  async runCrawlingKline1HourOfCurrentHour(): Promise<void> {
    this.logger.debug('Running method: runCrawlingKline1HourOfCurrentHour');
    (await this.priceCrawler.crawlKlineDataOfCurrentHour()).errThen(this.showError);
  }

  // Runs every odd minute, at 20 seconds past the minute, to update the current 1-day kline data
  @Cron('20 1-59/2 * * * *')
  async runCrawlingKline1DayOfCurrentDay(): Promise<void> {
    this.logger.debug('Running method: runCrawlingKline1DayOfCurrentDay');
    (await this.priceCrawler.crawlKlineDataOfCurrentDay()).errThen(this.showError);
  }

  // Runs every 15 minutes, at 5 seconds past the minute, to fetch the latest 15-minute kline data
  @Cron('5 */15 * * * *')
  async runKline15MinutesCrawling(): Promise<void> {
    this.logger.debug('Running method: runKline15MinutesCrawling');
    (await this.priceCrawler.crawlLatestDataOfKline15Minutes()).errThen(this.showError);
  }

  // Runs at 5 seconds past the first minute of every hour to fetch the latest 1-hour kline data
  @Cron('5 1 * * * *')
  async runKline1HourCrawling(): Promise<void> {
    this.logger.debug('Running method: runKline1HourCrawling');
    (await this.priceCrawler.crawlLatestDataOfKline1Hour()).errThen(this.showError);
  }

  // Runs at 5 seconds past 00:02 UTC every day to fetch the latest 1-day kline data
  @Cron('5 2 0 * * *', {timeZone: 'Etc/UTC'})
  async runKline1DayCrawling(): Promise<void> {
    this.logger.debug('Running method: runKline1DayCrawling');
    (await this.priceCrawler.crawlLatestDataOfKline1Day()).errThen(this.showError);
  }

  private showError(err: any): void {
    this.logger.error(err.message || err, err.stack);
  }
}
