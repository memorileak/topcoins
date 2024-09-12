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
    const result = await Result.fromExecutionAsync(async () => {
      // TODO: may need to handle symbols in batch of 25
      const res = await firstValueFrom(
        this.httpService.get(
          `${this.priceCrawlerConfig.binanceRestApiEndpoint}/api/v3/ticker/price`,
          {params: {symbols: JSON.stringify(symbols)}},
        ),
      );
      return (res.data || []).map((p: any) => PriceNow.newFromBinance(p));
    });
    return result.errThen((err) => this.handleAxiosError(err));
  }

  async getKline1HourInterval(klineParams: KlineParams): Promise<Result<PriceKline[]>> {
    const limit = klineParams.limit || 240;
    return this.getKline('1h', {...klineParams, limit});
  }

  async getKline1DayInterval(klineParams: KlineParams): Promise<Result<PriceKline[]>> {
    const limit = klineParams.limit || 120;
    return this.getKline('1d', {...klineParams, limit});
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
