import {Injectable, Logger} from '@nestjs/common';
import {Result} from '@topcoins/devkit';

import {PriceCrawlerConfig} from './PriceCrawlerConfig';
import {BinanceRestClient} from './BinanceRestClient';
import {PriceRepo} from './PriceRepo';

@Injectable()
export class PriceCrawler {
  private readonly logger = new Logger(PriceCrawler.name);

  constructor(
    private readonly priceCrawlerConfig: PriceCrawlerConfig,
    private readonly binanceRestClient: BinanceRestClient,
    private readonly priceRepo: PriceRepo,
  ) {
    this.handleError = this.handleError.bind(this);
  }

  initiallyCrawlKline1Hour(): Promise<Result<void>> {
    return Result.fromExecutionAsync(async () => {
      for (const symbol of this.priceCrawlerConfig.symbolTrackingList) {
        let result: Result<any> = await this.binanceRestClient.getKline1HourInterval({
          symbol,
          limit: 240,
        });
        result = await result.okThenAsync(async (prices) => {
          (await this.priceRepo.bulkUpsertPriceKline1Hour(prices)).unwrap();
        });
        result.errThen(this.handleError);
      }
    });
  }

  initiallyCrawlKline1Day(): Promise<Result<void>> {
    return Result.fromExecutionAsync(async () => {
      for (const symbol of this.priceCrawlerConfig.symbolTrackingList) {
        let result: Result<any> = await this.binanceRestClient.getKline1DayInterval({
          symbol,
          limit: 120,
        });
        result = await result.okThenAsync(async (prices) => {
          (await this.priceRepo.bulkUpsertPriceKline1Day(prices)).unwrap();
        });
        result.errThen(this.handleError);
      }
    });
  }

  crawlLatestDataOfKline1Hour(): Promise<Result<void>> {
    return Result.fromExecutionAsync(async () => {
      for (const symbol of this.priceCrawlerConfig.symbolTrackingList) {
        let result: Result<any> = await this.binanceRestClient.getKline1HourInterval({
          symbol,
          limit: 6,
        });
        result = await result.okThenAsync(async (prices) => {
          (await this.priceRepo.bulkUpsertPriceKline1Hour(prices)).unwrap();
        });
        result.errThen(this.handleError);
      }
    });
  }

  crawlLatestDataOfKline1Day(): Promise<Result<void>> {
    return Result.fromExecutionAsync(async () => {
      for (const symbol of this.priceCrawlerConfig.symbolTrackingList) {
        let result: Result<any> = await this.binanceRestClient.getKline1DayInterval({
          symbol,
          limit: 6,
        });
        result = await result.okThenAsync(async (prices) => {
          (await this.priceRepo.bulkUpsertPriceKline1Day(prices)).unwrap();
        });
        result.errThen(this.handleError);
      }
    });
  }

  crawlLatestDataOfPriceNow(): Promise<Result<void>> {
    return Result.fromExecutionAsync(async () => {
      let result: Result<any> = await this.binanceRestClient.getCurrentPriceOfSymbols(
        this.priceCrawlerConfig.symbolTrackingList,
      );
      result = await result.okThenAsync(async (prices) => {
        (await this.priceRepo.bulkUpsertPriceNow(prices)).unwrap();
      });
      result.errThen(this.handleError);
    });
  }

  private handleError(err: any): never {
    this.logger.error(err.message || err, err.stack);
    throw err;
  }
}
