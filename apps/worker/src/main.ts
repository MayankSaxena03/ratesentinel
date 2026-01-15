import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { WorkerHealthService } from './health/health.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const logger = new Logger('WorkerBootstrap');

  const health = app.get(WorkerHealthService);
  await health.checkRedis();

  logger.log('RateSentinel Worker started');
  logger.log('Worker is idle and waiting for jobs...');
}

bootstrap().catch((err) => {
  console.error('Worker failed to start', err);
  process.exit(1);
});
