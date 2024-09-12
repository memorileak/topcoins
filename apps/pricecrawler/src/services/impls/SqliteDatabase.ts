import {join} from 'node:path';
import {existsSync, mkdirSync} from 'node:fs';
import {Injectable, Logger} from '@nestjs/common';
import {Result} from '@topcoins/devkit';
import * as sqlite3 from 'sqlite3';

import {PriceCrawlerConfig} from './PriceCrawlerConfig';

export class Database extends sqlite3.Database {}

@Injectable()
export class SqliteDatabase {
  private readonly logger = new Logger(SqliteDatabase.name);

  private db: Database;
  private initialized = false;

  constructor(private readonly priceCrawlerConfig: PriceCrawlerConfig) {}

  async initialize(): Promise<Result<void>> {
    return new Promise((resolve) => {
      const databaseDir = join(process.cwd(), 'database');
      if (!existsSync(databaseDir)) {
        this.logger.debug(`Database directory does not exist, creating a new one: ${databaseDir}`);
        mkdirSync(databaseDir);
      }

      const databasePath = join(databaseDir, this.priceCrawlerConfig.databaseFileName);
      this.db = new Database(databasePath, (err: any) => {
        if (err) {
          this.logger.error(err.message || err, err.stack);
          resolve(Result.err(err));
        } else {
          this.logger.debug(`Successfully opened database file: ${databasePath}`);
          this.initialized = true;
          resolve(Result.ok(undefined));
        }
      });
    });
  }

  getDb(): Result<Database> {
    return Result.fromExecution(() => {
      if (this.initialized) {
        return this.db;
      } else {
        this.handleError(new Error('Database has not been initialized'));
      }
    });
  }

  private handleError(err: any): never {
    this.logger.error(err.message || err, err.stack);
    throw err;
  }
}
