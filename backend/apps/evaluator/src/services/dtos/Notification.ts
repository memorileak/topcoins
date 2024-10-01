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

  static newFromEvaluations(evaluations: EvaluationResult[]): Notification {
    const messages: string[] = [`_Time: ${new Date().toLocaleString('en-US')}_`];
    for (const evaluation of evaluations) {
      const {symbol, priceChangeCase, rsiChange, latestPrice, latestRSI14} = evaluation;
      const message = [
        [
          `*${Notification.baseCoinOnly(symbol).unwrapOr('?')}*`,
          `\`${priceChangeCase.replace(/_/g, '\\_')}\``,
          `\`${rsiChange > 0 ? '+' : ''}${numberFormat.format(rsiChange)}\``,
        ].join('  '),
        `*${currencyFormat.format(latestPrice)}*`,
        `${latestRSI14.join(', ')}`,
      ]
        .join('\n')
        .replace(/-/g, '\\-')
        .replace(/\+/g, '\\+')
        .replace(/\./g, '\\.');
      messages.push(message);
    }
    const message = messages.join('\n\n');
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
