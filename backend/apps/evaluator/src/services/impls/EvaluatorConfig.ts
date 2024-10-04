import {Injectable} from '@nestjs/common';
import {Expose} from 'class-transformer';

import {EvaluatorConfigRaw} from '../types/EvaluatorConfigRaw';

@Injectable()
export class EvaluatorConfig {
  @Expose() telegramBotApiEndpoint = '';
  @Expose() telegramBotToken = '';
  @Expose() telegramChatId = 0;
  @Expose() databaseFileName = '';
  @Expose() jumpThreshold = 10;
  @Expose() jumpFromWeakThreshold = 5;
  @Expose() dropThreshold = 15;
  @Expose() dropToWeakThreshold = 5;
  @Expose() notiCooldownMinutes = 5;
  @Expose() enableNotiForCases: string[] = [];

  private filled = false;

  fill(source: EvaluatorConfigRaw): EvaluatorConfig {
    this.filled = true;
    Object.assign(this, source);
    return this;
  }

  isFilled(): boolean {
    return this.filled;
  }
}
