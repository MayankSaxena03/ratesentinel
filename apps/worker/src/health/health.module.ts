import { Module } from '@nestjs/common';
import { WorkerHealthService } from './health.service';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  providers: [WorkerHealthService],
})
export class HealthModule {}
