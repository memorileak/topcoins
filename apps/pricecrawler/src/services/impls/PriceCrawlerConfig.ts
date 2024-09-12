import {Injectable} from '@nestjs/common';
import {Expose, plainToClassFromExist} from 'class-transformer';

import {PriceCrawlerConfigRaw} from '../types/PriceCrawlerConfigRaw';

@Injectable()
export class PriceCrawlerConfig {
  @Expose() binanceRestApiEndpoint = '';
  @Expose() symbolTrackingList: string[] = [];
  @Expose() databaseFileName = '';

  private filled = false;

  fill(source: PriceCrawlerConfigRaw): PriceCrawlerConfig {
    this.filled = true;
    return plainToClassFromExist(this, source, {
      excludeExtraneousValues: true,
      exposeDefaultValues: true,
    });
  }

  isFilled(): boolean {
    return this.filled;
  }
}
