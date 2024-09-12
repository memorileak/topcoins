import {Injectable} from '@nestjs/common';
import {Expose, plainToClassFromExist} from 'class-transformer';

import {DbExposerConfigRaw} from '../types/DbExposerConfigRaw';

@Injectable()
export class DbExposerConfig {
  @Expose() databaseFileName = '';

  private filled = false;

  fill(source: DbExposerConfigRaw): DbExposerConfig {
    this.filled = true;
    return plainToClassFromExist(this, source, {
      excludeExtraneousValues: true,
      exposeDefaultValues: true,
    });
  }

  isFilled(): boolean {
    return this.filled;
  }
}
