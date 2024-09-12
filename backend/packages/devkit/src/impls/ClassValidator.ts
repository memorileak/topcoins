import {Injectable} from '@nestjs/common';
import {validateOrReject, ValidatorOptions, ValidationError} from 'class-validator';

import {Result} from '../dtos/Result';

@Injectable()
export class ClassValidator {
  validate(instance: object, options?: ValidatorOptions): Promise<Result<void>> {
    return Result.fromExecutionAsync(async () => {
      try {
        await validateOrReject(instance, options);
      } catch (errors: any) {
        const messages: string[] = [];
        for (const err of errors as ValidationError[]) {
          for (const c in err.constraints || {}) {
            messages.push(err.constraints?.[c] || '');
          }
        }
        throw new Error(messages.join('\n'));
      }
    });
  }
}
