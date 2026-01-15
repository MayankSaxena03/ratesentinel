import { RequestDecision } from '../../requests-log/requests-log.entity';

export interface AuditEvent {
  tenantId: number;
  apiId: number;
  apiKeyId?: number;
  userId?: number;
  ip: string;
  method: string;
  path: string;
  statusCode: number;
  decision: RequestDecision;
  latencyMs?: number;
  snapshot?: Record<string, any> | null;
}
