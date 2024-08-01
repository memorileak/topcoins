import {Injectable} from '@nestjs/common';
import {Expose, plainToClassFromExist} from 'class-transformer';

import {PriceTrackerConfigRaw} from '../types/PriceTrackerConfigRaw';

@Injectable()
export class PriceTrackerConfig {
  @Expose() binanceStreamURI = '';
  @Expose() binanceStreamName = '';
  @Expose() priceTrackingIntervalSecs = 60;
  @Expose() priceTrackingWindowSize = 120;
  @Expose() topTokensListSize = 50;

  private filled = false;

  fill(source: PriceTrackerConfigRaw): PriceTrackerConfig {
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
