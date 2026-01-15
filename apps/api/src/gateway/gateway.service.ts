import { Injectable } from '@nestjs/common';
import { AuditQueue } from '../common/queues/audit.queue';
import { RequestDecision } from '../requests-log/requests-log.entity';
import { sanitizePayload } from '../common/utils/snapshot.util';

@Injectable()
export class GatewayService {
  constructor(private readonly auditQueue: AuditQueue) {}

  async allow(params: {
    tenantId: number;
    apiId: number;
    apiKeyId: number;
    ip: string;
    method: string;
    path: string;
    body: any;
  }) {
    const { tenantId, apiId, apiKeyId, ip, method, path, body } = params;

    const enableSnapshots = process.env.ENABLE_S3_SNAPSHOTS === 'true';

    const snapshot =
      enableSnapshots && body
        ? sanitizePayload(body, Number(process.env.MAX_SNAPSHOT_SIZE_KB))
        : null;

    await this.auditQueue.publish({
      tenantId,
      apiId,
      apiKeyId,
      ip,
      method,
      path,
      statusCode: 200,
      decision: RequestDecision.ALLOWED,
      latencyMs: 0,
      snapshot,
    });

    return {
      decision: 'ALLOW',
    };
  }
}
