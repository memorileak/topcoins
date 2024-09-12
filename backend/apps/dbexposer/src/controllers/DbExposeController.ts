import {Body, Controller, Get, HttpCode, HttpException, HttpStatus, Logger, Post} from '@nestjs/common';

import {SqliteDatabase} from '../services/impls/SqliteDatabase';

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
  async executeQuery(@Body('q') q: string): Promise<Record<string, any>[]> {
    let queryResult = await this.sqliteDatabase.query(q || '');
    queryResult = queryResult.errThen((err: any) => {
      this.logger.error(err.message || err, err.stack);
      throw new HttpException(err.message || 'Query execution failed', HttpStatus.BAD_REQUEST);
    });
    return queryResult.unwrap();
  }
}
