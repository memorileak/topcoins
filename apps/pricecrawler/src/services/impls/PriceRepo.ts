import {Injectable, Logger} from '@nestjs/common';
import {Result} from '@topcoins/devkit';

import {PriceNow} from '../dtos/PriceNow';
import {SqliteDatabase, Database} from './SqliteDatabase';
import {PriceKline} from '../dtos/PriceKline';

@Injectable()
export class PriceRepo {
  private readonly logger = new Logger(PriceRepo.name);

  private initializedWithoutErrors = true;

  constructor(private readonly sqliteDatabase: SqliteDatabase) {}

  async initialize(): Promise<Result<void>> {
    return new Promise((resolve) => {
      const priceRepo = this;
      const db = this.sqliteDatabase.getDb().unwrap();
      db.serialize(function () {
        db.run(
          `CREATE TABLE IF NOT EXISTS price_now (
            symbol TEXT PRIMARY KEY,
            time INTEGER NOT NULL,
            price REAL NOT NULL
          );`.replace(/\s+/g, ' '),
          priceRepo.handleInitializationError.bind(priceRepo),
        );

        db.run(
          `CREATE TABLE IF NOT EXISTS price_kline_1h (
            symbol TEXT NOT NULL,
            open_time INTEGER NOT NULL,
            close_time INTEGER NOT NULL,
            volume REAL NOT NULL,
            open_price REAL NOT NULL,
            high_price REAL NOT NULL,
            low_price REAL NOT NULL,
            close_price REAL NOT NULL
          );`.replace(/\s+/g, ' '),
          priceRepo.handleInitializationError.bind(priceRepo),
        );
        db.run(
          `CREATE UNIQUE INDEX IF NOT EXISTS uniq_pricekline1h_symbol_opentime ON price_kline_1h (symbol, open_time);`,
          priceRepo.handleInitializationError.bind(priceRepo),
        );
        db.run(
          `CREATE INDEX IF NOT EXISTS idx_pricekline1h_symbol ON price_kline_1h (symbol);`,
          priceRepo.handleInitializationError.bind(priceRepo),
        );
        db.run(
          `CREATE INDEX IF NOT EXISTS idx_pricekline1h_opentime ON price_kline_1h (open_time);`,
          priceRepo.handleInitializationError.bind(priceRepo),
        );

        db.run(
          `CREATE TABLE IF NOT EXISTS price_kline_1d (
            symbol TEXT NOT NULL,
            open_time INTEGER NOT NULL,
            close_time INTEGER NOT NULL,
            volume REAL NOT NULL,
            open_price REAL NOT NULL,
            high_price REAL NOT NULL,
            low_price REAL NOT NULL,
            close_price REAL NOT NULL
          );`.replace(/\s+/g, ' '),
          priceRepo.handleInitializationError.bind(priceRepo),
        );
        db.run(
          `CREATE UNIQUE INDEX IF NOT EXISTS uniq_pricekline1d_symbol_opentime ON price_kline_1d (symbol, open_time);`,
          priceRepo.handleInitializationError.bind(priceRepo),
        );
        db.run(
          `CREATE INDEX IF NOT EXISTS idx_pricekline1d_symbol ON price_kline_1d (symbol);`,
          priceRepo.handleInitializationError.bind(priceRepo),
        );
        db.run(
          `CREATE INDEX IF NOT EXISTS idx_pricekline1d_opentime ON price_kline_1d (open_time);`,
          function (err) {
            priceRepo.handleInitializationError(err);
            if (priceRepo.initializedWithoutErrors) {
              priceRepo.logger.debug('All tables and indexes have been created');
              resolve(Result.ok(undefined));
            } else {
              resolve(Result.err(new Error('Could not create all tables and indexes') as any));
            }
          },
        );
      });
    });
  }

  bulkUpsertPriceNow(symbolPrices: PriceNow[]): Promise<Result<void>> {
    const priceRepo = this;
    return Result.fromExecutionAsync(async () => {
      if (Array.isArray(symbolPrices) && symbolPrices.length > 0) {
        const db = this.sqliteDatabase.getDb().unwrap();
        const batchSize = 25;
        let i = 0;
        while (i < symbolPrices.length) {
          const batch = symbolPrices.slice(i, i + batchSize);
          const matrix = priceRepo.generateValuesMatrix(3, batch.length).unwrap();
          const values = batch.map((p) => [p.symbol, p.time, p.price]).flat();
          const query = `
            INSERT INTO price_now (symbol, time, price) 
            VALUES ${matrix} 
            ON CONFLICT (symbol) DO UPDATE SET time = excluded.time, price = excluded.price;
          `
            .trim()
            .replace(/\s+/g, ' ');
          priceRepo.logger.verbose(query);
          await priceRepo.promisifyQueryExecution(db, query, values);
          i += batchSize;
        }
      }
    });
  }

  bulkUpsertPriceKline1Hour(klinePrices: PriceKline[]): Promise<Result<void>> {
    return this.bulkUpsertPriceKline('price_kline_1h', klinePrices);
  }

  bulkUpsertPriceKline1Day(klinePrices: PriceKline[]): Promise<Result<void>> {
    return this.bulkUpsertPriceKline('price_kline_1d', klinePrices);
  }

  private bulkUpsertPriceKline(
    klineTable: string,
    klinePrices: PriceKline[],
  ): Promise<Result<void>> {
    const priceRepo = this;
    return Result.fromExecutionAsync(async () => {
      if (Array.isArray(klinePrices) && klinePrices.length > 0) {
        const db = this.sqliteDatabase.getDb().unwrap();
        const batchSize = 25;
        let i = 0;
        while (i < klinePrices.length) {
          const batch = klinePrices.slice(i, i + batchSize);
          const matrix = priceRepo.generateValuesMatrix(8, batch.length).unwrap();
          const values = batch
            .map((p) => [
              p.symbol,
              p.openTime,
              p.closeTime,
              p.volume,
              p.openPrice,
              p.highPrice,
              p.lowPrice,
              p.closePrice,
            ])
            .flat();
          const query = `
            INSERT INTO ${klineTable} (symbol, open_time, close_time, volume, open_price, high_price, low_price, close_price) 
            VALUES ${matrix} 
            ON CONFLICT (symbol, open_time)
            DO UPDATE SET
              close_time = excluded.close_time,
              volume = excluded.volume,
              open_price = excluded.open_price,
              high_price = excluded.high_price,
              low_price = excluded.low_price,
              close_price = excluded.close_price;
          `
            .trim()
            .replace(/\s+/g, ' ');
          priceRepo.logger.verbose(query);
          await priceRepo.promisifyQueryExecution(db, query, values);
          i += batchSize;
        }
      }
    });
  }

  private handleInitializationError(err: any): void {
    if (err) {
      this.initializedWithoutErrors = false;
      this.logger.error(err.message || err, err.stack);
    }
  }

  private promisifyQueryExecution<T = void>(
    db: Database,
    query: string,
    params: Array<string | number>,
  ): Promise<Result<T>> {
    const priceRepo = this;
    return new Promise((resolve) => {
      db.run(query, params, function (err, ...theRest) {
        if (err) {
          priceRepo.logger.error(err.message || err, err.stack);
          resolve(Result.err(err as any));
        } else {
          resolve(Result.ok(theRest as any));
        }
      });
    });
  }

  private generateValuesMatrix(cols: number, rows: number): Result<string> {
    return Result.fromExecution(() => {
      let tuple = '';
      for (let i = 0; i < cols; i += 1) {
        tuple += i === 0 ? '?' : ',?';
      }
      tuple = `(${tuple})`;
      let matrix = '';
      for (let i = 0; i < rows; i += 1) {
        matrix += i === 0 ? tuple : `,${tuple}`;
      }
      return matrix;
    });
  }
}
