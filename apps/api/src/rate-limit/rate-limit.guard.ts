import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { RateLimitEngine } from './rate-limit.engine';
import { RateRuleService } from '../apis/rate-rule.service';
import { Redis } from 'ioredis';
import { getEnv } from '../config/env';
import { RequestDecision } from '../requests-log/requests-log.entity';
import { AuditQueue } from 'src/common/queues/audit.queue';
import { sanitizePayload } from '../common/utils/snapshot.util';

import {
  requestsAllowedTotal,
  requestsBlockedTotal,
  requestsThrottledTotal,
  decisionLatencyMs,
  redisLatencyMs,
} from '../metrics/metrics.registry';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly MAX_429_COUNT = Number(getEnv('RATE_LIMIT_429_MAX_COUNT'));
  private readonly WINDOW_SECONDS = Number(
    getEnv('RATE_LIMIT_429_WINDOW_SECONDS'),
  );
  private readonly BLOCK_SECONDS = Number(
    getEnv('RATE_LIMIT_429_BLOCK_SECONDS'),
  );

  constructor(
    private readonly rateLimitEngine: RateLimitEngine,
    private readonly rateRuleService: RateRuleService,
    private readonly redis: Redis,
    private readonly auditQueue: AuditQueue,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const startTime = Date.now();

    const tenantId = req.tenantId;
    const userId = req.user?.id;
    const apiKeyId = req.apiKey?.id;
    const apiId = req.api?.id;

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? req.ip;

    if (!tenantId || !apiId) {
      return true;
    }

    const rules = this.rateRuleService.getRuntimeRules(apiId);
    if (!rules) {
      return true;
    }

    const decision = await this.rateLimitEngine.evaluateRequestLimits({
      tenantId,
      apiId,
      apiKeyId,
      userId,
      ip,
      rules,
    });

    const latencyMs = Date.now() - startTime;

    const enableSnapshots = process.env.ENABLE_S3_SNAPSHOTS === 'true';
    const snapshot =
      enableSnapshots && req.is('application/json')
        ? sanitizePayload(req.body, Number(process.env.MAX_SNAPSHOT_SIZE_KB))
        : null;

    switch (decision.decision) {
      case 'ALLOW': {
        requestsAllowedTotal.inc({
          tenant_id: String(tenantId),
          api_id: String(apiId),
        });

        decisionLatencyMs.observe(latencyMs);

        return true;
      }

      case 'THROTTLE': {
        requestsThrottledTotal.inc({
          tenant_id: String(tenantId),
          api_id: String(apiId),
        });

        decisionLatencyMs.observe(latencyMs);

        this.auditQueue.publish({
          tenantId,
          apiId,
          apiKeyId,
          userId,
          ip,
          method: req.method,
          path: req.originalUrl,
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          decision: RequestDecision.THROTTLED,
          latencyMs,
          snapshot,
        });

        if (tenantId && ip) {
          await this.trackRepeated429(tenantId, ip);
        }

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            message: 'Rate limit exceeded',
            retryAfterMs: decision.retryAfterMs,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      case 'BLOCK': {
        requestsBlockedTotal.inc({
          tenant_id: String(tenantId),
          api_id: String(apiId),
          reason: decision.reason ?? 'UNKNOWN',
        });

        decisionLatencyMs.observe(latencyMs);

        this.auditQueue.publish({
          tenantId,
          apiId,
          apiKeyId,
          userId,
          ip,
          method: req.method,
          path: req.originalUrl,
          statusCode: HttpStatus.FORBIDDEN,
          decision: RequestDecision.BLOCKED,
          latencyMs,
          snapshot,
        });

        throw new ForbiddenException({
          statusCode: HttpStatus.FORBIDDEN,
          error: 'Forbidden',
          message: decision.reason ?? 'Request blocked',
        });
      }
    }
  }

  private get429CounterKey(tenantId: number, ip: string): string {
    return `rl429:${tenantId}:ip:${ip}`;
  }

  private getBlockKey(tenantId: number, ip: string): string {
    return `block:${tenantId}:ip:${ip}`;
  }

  private async trackRepeated429(tenantId: number, ip: string): Promise<void> {
    const counterKey = this.get429CounterKey(tenantId, ip);

    let start = Date.now();
    const count = await this.redis.incr(counterKey);
    redisLatencyMs.observe(Date.now() - start);

    if (count === 1) {
      start = Date.now();
      await this.redis.expire(counterKey, this.WINDOW_SECONDS);
      redisLatencyMs.observe(Date.now() - start);
    }

    if (count >= this.MAX_429_COUNT) {
      const blockKey = this.getBlockKey(tenantId, ip);

      start = Date.now();
      await this.redis.set(blockKey, '1', 'EX', this.BLOCK_SECONDS);
      redisLatencyMs.observe(Date.now() - start);

      start = Date.now();
      await this.redis.del(counterKey);
      redisLatencyMs.observe(Date.now() - start);
    }
  }
}
