//{
//  "e": "1hTicker",
//  "E": 1722414290379,
//  "s": "XRPUSDT",
//  "p": "0.00260000",
//  "P": "0.402",
//  "w": "0.64628784",
//  "o": "0.64610000",
//  "h": "0.64920000",
//  "l": "0.64320000",
//  "c": "0.64870000",
//  "v": "12610103.00000000",
//  "q": "8149756.20490000",
//  "O": 1722410640000,
//  "C": 1722414289196,
//  "F": 636873302,
//  "L": 636889416,
//  "n": 16115
//}

import {Expose, plainToInstance} from 'class-transformer';
import {Result} from '@trinance/devkit';

export class PriceEvent {
  static tryFromRawEvent(rawEvent: Record<string, any>): Result<PriceEvent> {
    return Result.fromExecution(() => {
      if (rawEvent.E && rawEvent.s && rawEvent.c && rawEvent.C) {
        return plainToInstance(
          PriceEvent,
          {
            eventTime: rawEvent.e,
            symbol: rawEvent.s,
            price: parseFloat(rawEvent.c),
            priceTime: rawEvent.C,
          },
          {excludeExtraneousValues: true, exposeDefaultValues: true},
        );
      } else {
        throw new Error('Missing fields to construct price event');
      }
    });
  }

  @Expose() eventTime: number = 0;
  @Expose() symbol: string = '';
  @Expose() price: number = 0;
  @Expose() priceTime: number = 0;
}
