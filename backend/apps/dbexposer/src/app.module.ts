import {Module, OnApplicationBootstrap} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';

import {DbExposerConfig} from './services/impls/DbExposerConfig';
import {SqliteDatabase} from './services/impls/SqliteDatabase';

import {DbExposeController} from './controllers/DbExposeController';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [DbExposeController],
  providers: [DbExposerConfig, SqliteDatabase],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(
    private readonly configService: ConfigService,
    private readonly dbExposerConfig: DbExposerConfig,
    private readonly sqliteDatabase: SqliteDatabase,
  ) {}

  async onApplicationBootstrap() {
    this.dbExposerConfig.fill({
      databaseFileName: this.configService.get<string>('DATABASE_FILE_NAME', 'topcoins.db'),
    });
    (await this.sqliteDatabase.initialize()).unwrap();
  }
}
