import {join} from 'node:path';
import {existsSync} from 'node:fs';
import * as sqlite3 from 'sqlite3';
import {Injectable, Logger} from '@nestjs/common';
import {Result} from '@topcoins/devkit';

import {EvaluatorConfig} from './EvaluatorConfig';

export class Database extends sqlite3.Database {}

@Injectable()
export class SqliteDatabase {
  private readonly logger = new Logger(SqliteDatabase.name);

  private db: Database;
  private initialized = false;

  constructor(private readonly evaluatorConfig: EvaluatorConfig) {}

  async initialize(): Promise<Result<void>> {
    return new Promise((resolve) => {
      const databaseDir = join(process.cwd(), '..', '..', 'database');

      if (!existsSync(databaseDir)) {
        const err = new Error(`Database directory does not exist: ${databaseDir}`);
        this.logger.error(err.message || err, err.stack);
        resolve(Result.err(err as any));
      }

      const databasePath = join(databaseDir, this.evaluatorConfig.databaseFileName);

      this.db = new Database(databasePath, sqlite3.OPEN_READONLY, (err: any) => {
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

  query(query: string, params?: Array<string | number>): Promise<Result<Record<string, any>[]>> {
    return new Promise((resolve) => {
      const getDbResult = this.getDb();
      getDbResult.errThen((err) => resolve(Result.err(err as any)));
      getDbResult.okThen((db) => {
        db.all(query, params ?? [], (err, rows) => {
          if (err) {
            this.logger.error(err.message || err, err.stack);
            resolve(Result.err(err as any));
          } else {
            resolve(Result.ok(rows));
          }
        });
      });
    });
  }

  private getDb(): Result<Database> {
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
