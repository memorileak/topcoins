import {Module, OnApplicationBootstrap} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {ScheduleModule} from '@nestjs/schedule';
import {HttpModule} from '@nestjs/axios';

import {Crontab} from './services/impls/Crontab';
import {PriceCrawlerConfig} from './services/impls/PriceCrawlerConfig';
import {BinanceRestClient} from './services/impls/BinanceRestClient';
import {SqliteDatabase} from './services/impls/SqliteDatabase';
import {PriceRepo} from './services/impls/PriceRepo';
import {PriceCrawler} from './services/impls/PriceCrawler';

@Module({
  imports: [ConfigModule.forRoot(), ScheduleModule.forRoot(), HttpModule],
  controllers: [],
  providers: [
    Crontab,
    PriceCrawlerConfig,
    BinanceRestClient,
    SqliteDatabase,
    PriceRepo,
    PriceCrawler,
  ],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(
    private readonly configService: ConfigService,
    private readonly priceCrawlerConfig: PriceCrawlerConfig,
    private readonly sqliteDatabase: SqliteDatabase,
    private readonly priceRepo: PriceRepo,
    private readonly priceCrawler: PriceCrawler,
  ) {}

  async onApplicationBootstrap() {
    this.priceCrawlerConfig.fill({
      binanceRestApiEndpoint: this.configService.get<string>(
        'BINANCE_REST_API_ENDPOINT',
        'https://api.binance.com',
      ),
      symbolTrackingList: this.configService
        .get<string>('SYMBOL_TRACKING_LIST', 'BTCUSDT,ETHUSDT')
        .split(',')
        .map((s) => s.trim()),
      databaseFileName: this.configService.get<string>('DATABASE_FILE_NAME', 'topcoins.db'),
    });
    (await this.sqliteDatabase.initialize()).unwrap();
    (await this.priceRepo.initialize()).unwrap();
    (await this.priceCrawler.initiallyCrawlKline15Minutes()).unwrap();
    (await this.priceCrawler.initiallyCrawlKline1Hour()).unwrap();
    (await this.priceCrawler.initiallyCrawlKline1Day()).unwrap();
    (await this.priceCrawler.crawlLatestDataOfPriceNow()).unwrap();
  }
}
