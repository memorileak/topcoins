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

  // Runs every minutes, starting at 5 seconds past the minute
  @Cron('5 * * * * *')
  async runEvaluatingAllSymbols(): Promise<void> {
    this.logger.debug('Running method: runEvaluatingAllSymbols');
    (await this.evaluator.evaluateAllSymbols()).errThen(this.showError);
    (await this.telegramNotifier.sendPendingNotifications()).errThen(this.showError);
  }

  // Runs at the start of every hour
  @Cron('0 0 * * * *')
  async runCleaningUpSentNotifications(): Promise<void> {
    this.logger.debug('Running method: runCleaningUpSentNotifications');
    this.notificationQueue.cleanupSentNotifications().errThen(this.showError);
  }

  private showError(err: any): void {
    this.logger.error(err.message || err, err.stack);
  }
}

// Cron expression format: * * * * * *
// | | | | | |
// | | | | | +-- Day of the Week   (range: 0-7, 0 or 7 is Sunday)
// | | | | +---- Month             (range: 1-12)
// | | | +------ Day of the Month  (range: 1-31)
// | | +-------- Hour              (range: 0-23)
// | +---------- Minute            (range: 0-59)
// +------------ Second            (range: 0-59, optional)

// Special characters:
// * : matches any value
// , : separates multiple values (e.g., 1,3,5)
// - : specifies a range (e.g., 1-5)
// / : specifies steps (e.g., */5 for "every 5 units")
