import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';

import {SqliteDatabase} from '../services/impls/SqliteDatabase';

type QueryOutput = Record<string, any>[];

@Controller('*')
export class DbExposeController {
  private readonly logger = new Logger(DbExposeController.name);

  constructor(private readonly sqliteDatabase: SqliteDatabase) {}

  @Get()
  pong(): string {
    return 'Database Exposer';
  }

  @Post()
  @HttpCode(200)
  async executeQuery(@Body('q') q: string | string[]): Promise<QueryOutput | QueryOutput[]> {
    const isMultiQueries = Array.isArray(q);
    const sqlQueries = isMultiQueries ? q : [q];
    const queryOutputs: QueryOutput[] = [];

    for (const sql of sqlQueries) {
      let queryResult = await this.sqliteDatabase.query(sql || '');
      queryResult = queryResult.errThen((err: any) => {
        this.logger.error(err.message || err, err.stack);
        throw new HttpException(err.message || 'Query execution failed', HttpStatus.BAD_REQUEST);
      });
      queryOutputs.push(queryResult.unwrap());
    }

    return isMultiQueries ? queryOutputs : queryOutputs[0];
  }
}
