import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuditQueue } from './audit.queue';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audit-log',
    }),
  ],
  providers: [AuditQueue],
  exports: [AuditQueue],
})
export class QueuesModule {}
