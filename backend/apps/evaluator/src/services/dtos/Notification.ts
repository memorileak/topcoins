import {randomBytes} from 'crypto';
import {Expose, plainToInstance} from 'class-transformer';

import {EvaluationResult} from '../types/EvaluationResult';
import {Result} from '@topcoins/devkit';

const currencyFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 20,
});

const numberFormat = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 20,
});

export class Notification {
  private static baseCoinOnly(symbol: string): Result<string> {
    return Result.fromExecution(() => symbol.split('USDT')[0] ?? '');
  }

  static newFromEvaluationResult(evaluation: EvaluationResult): Notification {
    const {symbol, priceChangeCase, rsiChange, latestPrice, latestRSI14} = evaluation;
    const message = [
      `*${Notification.baseCoinOnly(symbol).unwrapOr('?')} - ${priceChangeCase}*`,
      '',
      `Price: *${currencyFormat.format(latestPrice)}*`,
      `RSI change: *${rsiChange > 0 ? '+' : ''}${numberFormat.format(rsiChange)}*`,
      `RSI values: *${latestRSI14.join(', ')}*`,
      '',
      `_Time: ${new Date().toLocaleString('en-US')}_`,
    ]
      .join('\n')
      .replace(/-/g, '\\-')
      .replace(/\+/g, '\\+')
      .replace(/\./g, '\\.');
    return Notification.newFromMessage(message);
  }

  static newFromMessage(message: string): Notification {
    return plainToInstance(
      Notification,
      {
        id: randomBytes(16).toString('hex'),
        message: message,
        sentToTelegram: false,
      },
      {excludeExtraneousValues: true, exposeDefaultValues: true},
    );
  }

  @Expose() id: string = '';
  @Expose() message: string = '';
  @Expose() sentToTelegram: boolean = false;
}
