import {NestFactory} from '@nestjs/core';

import {AppModule} from './app.module';
import {ConfigService} from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: [
      'fatal',
      'error',
      'log',
      'warn',
      'debug',
      //'verbose'
    ],
  });
  app.enableCors();
  const configService = app.get(ConfigService);
  const port = parseInt(configService.get<string>('SERVER_PORT', '3001'));
  await app.listen(port);
}

bootstrap();
