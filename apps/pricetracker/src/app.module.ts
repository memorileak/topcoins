import {Module, OnApplicationBootstrap} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {ScheduleModule} from '@nestjs/schedule';

import {PriceTracker} from './services/impls/PriceTracker';
import {PriceTrackerConfig} from './services/impls/PriceTrackerConfig';
import {BinanceStreamConsumer} from './services/impls/BinanceStreamConsumer';

import {TopTokensController} from './controllers/TopTokensController';

@Module({
  imports: [ConfigModule.forRoot(), ScheduleModule.forRoot()],
  controllers: [TopTokensController],
  providers: [PriceTrackerConfig, BinanceStreamConsumer, PriceTracker],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(
    private readonly configService: ConfigService,
    private readonly priceTrackerConfig: PriceTrackerConfig,
    private readonly priceTracker: PriceTracker,
  ) {}

  onApplicationBootstrap() {
    this.priceTrackerConfig.fill({
      binanceStreamURI: this.configService.get<string>(
        'BINANCE_STREAM_URI',
        'wss://stream.binance.com/stream',
      ),
      binanceStreamName: this.configService.get<string>(
        'BINANCE_STREAM_NAME',
        '!ticker_1h@arr@3000ms',
      ),
      priceTrackingIntervalSecs:
        parseInt(this.configService.get<string>('PRICE_TRACKING_INTERVAL_SECS', '300')) || 300,
      priceTrackingWindowSize:
        parseInt(this.configService.get<string>('PRICE_TRACKING_WINDOW_SIZE', '144')) || 144,
      topTokensListSize:
        parseInt(this.configService.get<string>('TOP_TOKEN_LIST_SIZE', '50')) || 50,
    });
    this.priceTracker.start();
  }
}
