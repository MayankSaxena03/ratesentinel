import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { DataSource } from 'typeorm';
import { RequestsLogEntity } from '../entities/requests-log.entity';
import { S3Service } from '../s3/s3.service';

const ABUSE_QUEUE = 'abuse-detection';

@Processor('audit-log')
export class AuditProcessor extends WorkerHost {
  private s3 = new S3Service();

  private readonly abuseQueue = new Queue(ABUSE_QUEUE, {
    connection: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    },
  });

  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async process(job: Job) {
    const e = job.data;

    let snapshotUrl: string | null = null;

    if (e.snapshot) {
      try {
        const key = `${e.tenantId}/${Date.now()}-${job.id}.json`;
        snapshotUrl = await this.s3.uploadJson(
          process.env.S3_BUCKET_NAME!,
          key,
          e.snapshot,
        );
      } catch (err) {
        console.error('Snapshot upload failed', err);
      }
    }

    await this.dataSource.getRepository(RequestsLogEntity).insert({
      tenant_id: e.tenantId,
      api_id: e.apiId,
      api_key_id: e.apiKeyId ?? null,
      user_id: e.userId ?? null,
      ip_address: e.ip,
      method: e.method,
      path: e.path,
      status_code: e.statusCode,
      decision: e.decision,
      latency_ms: e.latencyMs ?? null,
      snapshot_s3_url: snapshotUrl,
    });

    this.abuseQueue.add(
      'detect',
      {
        tenantId: e.tenantId,
        apiId: e.apiId,
        apiKeyId: e.apiKeyId ?? undefined,
        ipAddress: e.ip,
        statusCode: e.statusCode,
      },
      {
        removeOnComplete: true,
        attempts: 2,
      },
    );
  }
}
