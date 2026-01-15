import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AuditEvent } from '../interfaces/audit-event.interface';

@Injectable()
export class AuditQueue {
  constructor(
    @InjectQueue('audit-log')
    private readonly queue: Queue,
  ) {}

  publish(event: AuditEvent): void {
    this.queue.add('audit', event, {
      removeOnComplete: true,
      attempts: 3,
    });
  }
}
