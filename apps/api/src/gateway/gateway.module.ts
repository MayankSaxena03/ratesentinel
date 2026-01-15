import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';

import { ApiKeyModule } from '../api-keys/api-key.module';
import { BlockedEventsModule } from '../blocked-events/blocked-events.module';
import { ApiModule } from '../apis/api.module';
import { QueuesModule } from '../common/queues/queues.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';

@Module({
  imports: [
    ApiKeyModule,
    BlockedEventsModule,
    ApiModule,
    QueuesModule,
    RateLimitModule,
  ],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}
