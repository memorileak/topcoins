import {NestFactory} from '@nestjs/core';
import {ConfigService} from '@nestjs/config';

import {AppModule} from './app.module';
import {PriceTracker} from './services/impls/PriceTracker';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: [
      'fatal',
      'error',
      'log',
      'warn',
      //'debug',
      //'verbose'
    ],
  });
  const port = app.get(ConfigService).get<string>('SERVER_PORT', '3000') || 3000;
  app.get(PriceTracker).start();
  await app.listen(port);
}

bootstrap();
