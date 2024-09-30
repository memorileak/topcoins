import {Injectable} from '@nestjs/common';
import {Expose} from 'class-transformer';

import {EvaluatorConfigRaw} from '../types/EvaluatorConfigRaw';

@Injectable()
export class EvaluatorConfig {
  @Expose() telegramBotApiEndpoint = '';
  @Expose() telegramBotToken = '';
  @Expose() telegramChatId = 0;
  @Expose() databaseFileName = '';
  @Expose() rsiChangeThreshold = 10;

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
