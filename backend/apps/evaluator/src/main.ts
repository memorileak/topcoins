import {NestFactory} from '@nestjs/core';

import {AppModule} from './app.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(AppModule, {
    logger: [
      'fatal',
      'error',
      'log',
      'warn',
      'debug',
      //'verbose'
    ],
  });
}

bootstrap();
