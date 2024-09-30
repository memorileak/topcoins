import {Injectable, Logger} from '@nestjs/common';
import {HttpService} from '@nestjs/axios';
import {Result} from '@topcoins/devkit';
import {firstValueFrom} from 'rxjs';

import {Notification} from '../dtos/Notification';
import {TelegramHttpError} from '../dtos/TelegramHttpError';
import {NotificationQueue} from './NotificationQueue';
import {EvaluatorConfig} from './EvaluatorConfig';

@Injectable()
export class TelegramNotifier {
  private readonly logger = new Logger(TelegramNotifier.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly evaluatorConfig: EvaluatorConfig,
    private readonly notificationQueue: NotificationQueue,
  ) {
    this.handleAxiosError = this.handleAxiosError.bind(this);
  }

  async sendPendingNotifications(): Promise<Result<void>> {
    const result = await Result.fromExecutionAsync(async () => {
      const {telegramBotApiEndpoint, telegramBotToken, telegramChatId} = this.evaluatorConfig;

      const pendingNotifications = this.notificationQueue
        .getNotifications((noti) => !noti.sentToTelegram)
        .unwrapOr([]);

      pendingNotifications.unshift(
        Notification.newFromMessage(
          ['`================================`', '`================================`'].join('\n'),
        ),
      );

      for (const noti of pendingNotifications) {
        await firstValueFrom(
          this.httpService.post(
            `${telegramBotApiEndpoint}/bot${telegramBotToken}/sendMessage`,
            {chat_id: telegramChatId, text: noti.message, parse_mode: 'MarkdownV2'},
            {headers: {'Content-Type': 'application/json'}},
          ),
        );
        this.notificationQueue
          .updateNotification(noti.id, (n) => (n.sentToTelegram = true))
          .unwrap();
      }
    });
    return result.errThen(this.handleAxiosError);
  }

  private handleAxiosError(err: any): never {
    const telegramErr = TelegramHttpError.fromAxiosError(err);
    this.logger.error(telegramErr.message || telegramErr, telegramErr.stack);
    throw telegramErr;
  }
}
