import {Module} from '@nestjs/common';

import {ClassValidator} from './src/impls/ClassValidator';

@Module({
  imports: [],
  controllers: [],
  providers: [ClassValidator],
  exports: [ClassValidator],
})
export class DevkitModule {}
