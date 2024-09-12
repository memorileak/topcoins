import {AxiosError} from 'axios';
import {Expose, plainToInstance} from 'class-transformer';

enum BinanceRestErrorType {
  WAF_LIMIT_VIOLATED = 'WAF_LIMIT_VIOLATED',
  CANCELREPLACE_ORDER_PARTIALLY_SUCCEEDS = 'CANCELREPLACE_ORDER_PARTIALLY_SUCCEEDS',
  REQUEST_RATE_LIMIT_VIOLATED = 'REQUEST_RATE_LIMIT_VIOLATED',
  IP_BANNED = 'IP_BANNED',
  MALFORMED_REQUEST = 'MALFORMED_REQUEST',
  BINANCE_INTERNAL_ERROR = 'BINANCE_INTERNAL_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export class BinanceRestError implements Error {
  private static parseErrorTypeFromHttpStatus(status?: number): BinanceRestErrorType {
    if (status === 403) {
      return BinanceRestErrorType.WAF_LIMIT_VIOLATED;
    } else if (status === 409) {
      return BinanceRestErrorType.CANCELREPLACE_ORDER_PARTIALLY_SUCCEEDS;
    } else if (status === 429) {
      return BinanceRestErrorType.REQUEST_RATE_LIMIT_VIOLATED;
    } else if (status === 418) {
      return BinanceRestErrorType.IP_BANNED;
    } else if (400 <= status && status < 500) {
      return BinanceRestErrorType.MALFORMED_REQUEST;
    } else if (500 <= status && status < 600) {
      return BinanceRestErrorType.BINANCE_INTERNAL_ERROR;
    } else {
      return BinanceRestErrorType.UNKNOWN;
    }
  }

  static fromAxiosError(err: AxiosError): BinanceRestError {
    return plainToInstance(
      BinanceRestError,
      {
        stack: err.stack,
        httpStatus: err.status,
        type: BinanceRestError.parseErrorTypeFromHttpStatus(err.status),
        requestDetail: {
          protocol: err.request?.protocol,
          host: err.request?.host,
          method: err.request?.method,
          path: err.request?.path,
        },
        responseBody: err.response?.data,
      },
      {excludeExtraneousValues: true, exposeDefaultValues: true},
    );
  }

  @Expose() name = 'BinanceRestError';
  @Expose() stack: null;

  @Expose() httpStatus: number = 0;
  @Expose() type: BinanceRestErrorType = BinanceRestErrorType.UNKNOWN;
  @Expose() requestDetail: Record<string, any> = {};
  @Expose() responseBody: any = null;

  get message(): string {
    return (
      `\n${this.name} ` +
      JSON.stringify(
        {
          httpStatus: this.httpStatus,
          type: this.type,
          requestDetail: this.requestDetail,
          responseBody: this.responseBody,
        },
        null,
        2,
      )
    );
  }
}
