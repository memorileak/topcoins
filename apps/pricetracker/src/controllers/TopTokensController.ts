import {Controller, Get} from '@nestjs/common';

import {PriceTracker} from '../services/impls/PriceTracker';

@Controller('toptokens')
export class TopTokensController {
  constructor(private readonly priceTracker: PriceTracker) {}

  @Get()
  getTopTokens(): Record<string, any>[] {
    return this.priceTracker.getTopTokens().unwrap();
  }
}
