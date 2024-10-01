import {Module} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {ScheduleModule} from '@nestjs/schedule';
import {HttpModule} from '@nestjs/axios';

import {SqliteDatabase} from './services/impls/SqliteDatabase';
import {EvaluatorConfig} from './services/impls/EvaluatorConfig';
import {Evaluator} from './services/impls/Evaluator';
import {TelegramNotifier} from './services/impls/TelegramNotifier';
import {NotificationQueue} from './services/impls/NotificationQueue';
import {Crontab} from './services/impls/Crontab';

@Module({
  imports: [ConfigModule.forRoot(), ScheduleModule.forRoot(), HttpModule],
  controllers: [],
  providers: [
    SqliteDatabase,
    EvaluatorConfig,
    Evaluator,
    TelegramNotifier,
    NotificationQueue,
    Crontab,
  ],
})
export class AppModule {
  constructor(
    private readonly configService: ConfigService,
    private readonly evaluatorConfig: EvaluatorConfig,
    private readonly sqliteDatabase: SqliteDatabase,
    private readonly evaluator: Evaluator,
  ) {}

  async onApplicationBootstrap() {
    this.evaluatorConfig.fill({
      telegramBotApiEndpoint: this.configService.get<string>(
        'TELEGRAM_BOT_API_ENDPOINT',
        'https://api.telegram.org',
      ),
      telegramBotToken: this.configService.get<string>('TELEGRAM_BOT_TOKEN', ''),
      telegramChatId: parseInt(this.configService.get<string>('TELEGRAM_CHAT_ID', '0')),
      databaseFileName: this.configService.get<string>('DATABASE_FILE_NAME', 'topcoins.db'),
      rsiIncrementThreshold: parseFloat(
        this.configService.get<string>('RSI_INCREMENT_THRESHOLD', '10'),
      ),
      rsiDecrementThreshold: parseFloat(
        this.configService.get<string>('RSI_DECREMENT_THRESHOLD', '15'),
      ),
      enableNotiForCases: this.configService
        .get<string>('ENABLE_NOTI_FOR_CASES', '')
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== ''),
    });
    (await this.sqliteDatabase.initialize()).unwrap();
    (await this.evaluator.initialize()).unwrap();
  }
}
