import { Module } from '@nestjs/common';
import { RateLimitEngine } from './rate-limit.engine';
import { RedisModule } from 'src/config/redis.module';
import { ApiModule } from 'src/apis/api.module';
import { QueuesModule } from 'src/common/queues/queues.module';
import { RateLimitGuard } from './rate-limit.guard';

@Module({
  providers: [RateLimitEngine, RateLimitGuard],
  exports: [RateLimitEngine],
  imports: [RedisModule, ApiModule, QueuesModule],
})
export class RateLimitModule {}
