import {join} from 'node:path';
import {Module, OnApplicationBootstrap} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {ServeStaticModule} from '@nestjs/serve-static';
import {ScheduleModule} from '@nestjs/schedule';

import {Crontab} from './services/impls/Crontab';
import {PriceTracker} from './services/impls/PriceTracker';
import {PriceTrackerConfig} from './services/impls/PriceTrackerConfig';
import {BinanceStreamConsumer} from './services/impls/BinanceStreamConsumer';

import {TopTokensController} from './controllers/TopTokensController';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'public'),
      exclude: ['toptokens'],
      serveStaticOptions: {
        index: 'index.html',
      },
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [TopTokensController],
  providers: [Crontab, PriceTrackerConfig, BinanceStreamConsumer, PriceTracker],
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
      priceTrackingWindowSize:
        parseInt(this.configService.get<string>('PRICE_TRACKING_WINDOW_SIZE', '144')) || 144,
      topTokensListSize:
        parseInt(this.configService.get<string>('TOP_TOKEN_LIST_SIZE', '50')) || 50,
    });
    this.priceTracker.start();
  }
}
