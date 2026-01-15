import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from 'src/config/redis.module';

import { BlockedEvent } from './blocked-event.entity';
import { BlockedEventsService } from './blocked-events.service';
import { BlockedEventsController } from './blocked-events.controller';
import { TenantsModule } from 'src/tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlockedEvent]),
    RedisModule,
    TenantsModule,
  ],
  providers: [BlockedEventsService],
  controllers: [BlockedEventsController],
  exports: [BlockedEventsService],
})
export class BlockedEventsModule {}
