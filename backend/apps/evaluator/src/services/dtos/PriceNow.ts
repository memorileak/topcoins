import {Expose, plainToInstance} from 'class-transformer';

export class PriceNow {
  static fromSqliteRow(row: Record<string, any>): PriceNow {
    return plainToInstance(
      PriceNow,
      {
        symbol: row.symbol ?? '',
        time: row.time ?? 0,
        price: row.price ?? 0,
      },
      {excludeExtraneousValues: true, exposeDefaultValues: true},
    );
  }

  @Expose() symbol: string = '';
  @Expose() time: number = 0;
  @Expose() price: number = 0;
}
