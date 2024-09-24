import {Injectable, Logger} from '@nestjs/common';
import {HttpService} from '@nestjs/axios';
import {firstValueFrom} from 'rxjs';
import {Result} from '@topcoins/devkit';

import {PriceNow} from '../dtos/PriceNow';
import {BinanceRestError} from '../dtos/BinanceRestError';
import {KlineParams} from '../types/KlineParams';
import {PriceCrawlerConfig} from './PriceCrawlerConfig';
import {PriceKline} from '../dtos/PriceKline';

@Injectable()
export class BinanceRestClient {
  private readonly logger = new Logger(BinanceRestClient.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly priceCrawlerConfig: PriceCrawlerConfig,
  ) {}

  async getCurrentPriceOfSymbols(symbols: string[]): Promise<Result<PriceNow[]>> {
    const batchSize = 25;
    const result = await Result.fromExecutionAsync(async () => {
      let allPrices: PriceNow[] = [];
      for (let i = 0; i < symbols.length; i += batchSize) {
        const batchSymbols = symbols.slice(i, i + batchSize);
        const res = await firstValueFrom(
          this.httpService.get(
            `${this.priceCrawlerConfig.binanceRestApiEndpoint}/api/v3/ticker/price`,
            {params: {symbols: JSON.stringify(batchSymbols)}},
          ),
        );
        const batchPrices = (res.data || []).map((p: any) => PriceNow.newFromBinance(p));
        allPrices = allPrices.concat(batchPrices);
      }
      return allPrices;
    });
    return result.errThen((err) => this.handleAxiosError(err));
  }

  async getKline15MinutesInterval(klineParams: KlineParams): Promise<Result<PriceKline[]>> {
    const limit = klineParams.limit || 420;
    return this.getKline('15m', {...klineParams, limit});
  }

  async getKline1HourInterval(klineParams: KlineParams): Promise<Result<PriceKline[]>> {
    const limit = klineParams.limit || 420;
    return this.getKline('1h', {...klineParams, limit});
  }

  async getKline1DayInterval(klineParams: KlineParams): Promise<Result<PriceKline[]>> {
    const limit = klineParams.limit || 420;
    return this.getKline('1d', {...klineParams, limit});
  }

  async getKline15MinutesRecordOfCurrent15Minutes(symbol: string): Promise<Result<PriceKline>> {
    return Result.fromExecutionAsync(async () => {
      let result = await this.getKline('15m', {symbol, limit: 1});
      return result.unwrap()[0];
    });
  }

  async getKline1HourRecordOfCurrentHour(symbol: string): Promise<Result<PriceKline>> {
    return Result.fromExecutionAsync(async () => {
      let result = await this.getKline('1h', {symbol, limit: 1});
      return result.unwrap()[0];
    });
  }

  async getKline1DayRecordOfCurrentDay(symbol: string): Promise<Result<PriceKline>> {
    return Result.fromExecutionAsync(async () => {
      let result = await this.getKline('1d', {symbol, limit: 1});
      return result.unwrap()[0];
    });
  }

  private async getKline(
    interval: string,
    klineParams: KlineParams,
  ): Promise<Result<PriceKline[]>> {
    const result = await Result.fromExecutionAsync(async () => {
      const {symbol, limit} = klineParams;
      const res = await firstValueFrom(
        this.httpService.get(`${this.priceCrawlerConfig.binanceRestApiEndpoint}/api/v3/klines`, {
          params: {
            interval,
            symbol,
            limit,
          },
        }),
      );
      return (res.data || []).map((p: any) => PriceKline.newForSymbolFromBinance(symbol, p));
    });
    return result.errThen((err) => this.handleAxiosError(err));
  }

  private handleAxiosError(err: any): never {
    const binanceErr = BinanceRestError.fromAxiosError(err);
    this.logger.error(binanceErr.message || binanceErr, binanceErr.stack);
    throw binanceErr;
  }
}
