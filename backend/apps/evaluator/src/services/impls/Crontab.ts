import {Injectable, Logger} from '@nestjs/common';
import {Cron} from '@nestjs/schedule';

import {Evaluator} from './Evaluator';
import {NotificationQueue} from './NotificationQueue';
import {TelegramNotifier} from './TelegramNotifier';

@Injectable()
export class Crontab {
  private readonly logger = new Logger(Crontab.name);

  constructor(
    private readonly evaluator: Evaluator,
    private readonly notificationQueue: NotificationQueue,
    private readonly telegramNotifier: TelegramNotifier,
  ) {
    this.showError = this.showError.bind(this);
  }

  @Cron('*/30 * * * * *')
  async runEvaluatingAllSymbols(): Promise<void> {
    this.logger.debug('Running method: runEvaluatingAllSymbols');
    (await this.evaluator.evaluateAllSymbols()).errThen(this.showError);
    (await this.telegramNotifier.sendPendingNotifications()).errThen(this.showError);
  }

  @Cron('0 0 * * * *')
  async runCleaningUpSentNotifications(): Promise<void> {
    this.logger.debug('Running method: runCleaningUpSentNotifications');
    this.notificationQueue.cleanupSentNotifications().errThen(this.showError);
  }

  private showError(err: any): void {
    this.logger.error(err.message || err, err.stack);
  }
}
