import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AbuseProcessor } from './abuse.processor';
import { AuditProcessor } from './audit.processor';
import { ABUSE_QUEUE } from './abuse.queue';

@Module({
  imports: [
    BullModule.registerQueue({
      name: ABUSE_QUEUE,
    }),
    BullModule.registerQueue({
      name: 'audit-log',
    }),
  ],
  providers: [AbuseProcessor, AuditProcessor],
})
export class WorkerQueuesModule {}
