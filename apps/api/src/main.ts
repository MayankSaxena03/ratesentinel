import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = new Logger('Bootstrap');

  app.enableShutdownHooks();

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);

  logger.log(`RateSentinel API running on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('API failed to start', err);
  process.exit(1);
});
