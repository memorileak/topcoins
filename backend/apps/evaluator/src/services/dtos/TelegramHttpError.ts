import {AxiosError} from 'axios';
import {Expose, plainToInstance} from 'class-transformer';

export class TelegramHttpError implements Error {
  static fromAxiosError(err: AxiosError): TelegramHttpError {
    return plainToInstance(
      TelegramHttpError,
      {
        stack: err.stack,
        httpStatus: err.status,
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

  @Expose() name = 'TelegramHttpError';
  @Expose() stack: null;

  @Expose() httpStatus: number = 0;
  @Expose() requestDetail: Record<string, any> = {};
  @Expose() responseBody: any = null;

  get message(): string {
    return (
      `\n${this.name} ` +
      JSON.stringify(
        {
          httpStatus: this.httpStatus,
          requestDetail: this.requestDetail,
          responseBody: this.responseBody,
        },
        null,
        2,
      )
    );
  }
}
