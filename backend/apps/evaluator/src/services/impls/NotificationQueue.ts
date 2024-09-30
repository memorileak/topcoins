import {Injectable} from '@nestjs/common';
import {Result} from '@topcoins/devkit';

import {Notification} from '../dtos/Notification';

@Injectable()
export class NotificationQueue {
  private notiQueue: Notification[] = [];

  pushNotification(notification: Notification): Result<void> {
    return Result.fromExecution(() => {
      this.notiQueue.push(notification);
    });
  }

  getNotifications(filter: (noti: Notification) => boolean): Result<Notification[]> {
    return Result.fromExecution(() => {
      return this.notiQueue.filter(filter);
    });
  }

  updateNotification(id: string, updater: (noti: Notification) => void): Result<void> {
    return Result.fromExecution(() => {
      for (const noti of this.notiQueue) {
        if (noti.id === id) {
          updater(noti);
          break;
        }
      }
    });
  }

  cleanupSentNotifications(): Result<void> {
    return Result.fromExecution(() => {
      this.notiQueue = this.notiQueue.filter((noti) => !noti.sentToTelegram);
    });
  }
}
