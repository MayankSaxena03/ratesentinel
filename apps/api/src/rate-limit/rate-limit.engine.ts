import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  buildTokenBucketKey,
  RateLimitDimension,
} from './utils/redis-key.util';
import {
  RateLimitDecision,
  TokenBucketRule,
  SlidingWindowRule,
  DimensionRateRule,
} from './rate-limit.types';

@Injectable()
export class RateLimitEngine {
  private tokenBucketScript: string;
  private slidingWindowScript: string;

  constructor(private readonly redis: Redis) {
    this.tokenBucketScript = readFileSync(
      join(__dirname, 'redis/token-bucket.lua'),
      'utf8',
    );

    this.slidingWindowScript = readFileSync(
      join(__dirname, 'redis/sliding-window.lua'),
      'utf8',
    );
  }

  async consumeToken(params: {
    tenantId: number;
    apiId: number;
    dimension: RateLimitDimension;
    identifier: string | number;
    rule: TokenBucketRule;
    cost?: number;
  }): Promise<RateLimitDecision> {
    const { tenantId, apiId, dimension, identifier, rule } = params;
    const cost = params.cost ?? 1;

    const key = buildTokenBucketKey({
      tenantId,
      apiId,
      dimension,
      identifier,
    });

    const now = Date.now();

    const [allowed, remainingTokens] = (await this.redis.eval(
      this.tokenBucketScript,
      1,
      key,
      rule.capacity,
      rule.refillRate,
      now,
      cost,
    )) as [number, number];

    if (allowed === 1) {
      return { decision: 'ALLOW' };
    }

    const retryAfterMs =
      Math.ceil((cost - remainingTokens) / rule.refillRate) * 1000;

    return {
      decision: 'THROTTLE',
      retryAfterMs,
    };
  }

  async checkSlidingWindow(params: {
    tenantId: number;
    apiId: number;
    dimension: RateLimitDimension;
    identifier: string | number;
    rule: SlidingWindowRule;
  }): Promise<RateLimitDecision> {
    const { tenantId, apiId, dimension, identifier, rule } = params;

    const key = `rl:${tenantId}:${apiId}:${dimension}:${identifier}:sw:${rule.windowMs}`;
    const now = Date.now();

    const [allowed] = (await this.redis.eval(
      this.slidingWindowScript,
      1,
      key,
      now,
      rule.windowMs,
      rule.limit,
    )) as [number, number];

    if (allowed === 1) {
      return { decision: 'ALLOW' };
    }

    return {
      decision: 'THROTTLE',
      retryAfterMs: rule.windowMs,
    };
  }

  async evaluateRequestLimits(params: {
    tenantId: number;
    apiId: number;
    apiKeyId?: string;
    userId?: number;
    ip: string;
    rules: {
      api?: DimensionRateRule;
      apiKey?: DimensionRateRule;
      user?: DimensionRateRule;
      ip?: DimensionRateRule;
    };
  }): Promise<RateLimitDecision> {
    const { tenantId, apiId, apiKeyId, userId, ip, rules } = params;

    const checks: Array<{
      dimension: 'api' | 'api_key' | 'user' | 'ip';
      identifier?: string | number;
      rule?: DimensionRateRule;
    }> = [
      { dimension: 'api', identifier: apiId, rule: rules.api },
      { dimension: 'api_key', identifier: apiKeyId, rule: rules.apiKey },
      { dimension: 'user', identifier: userId, rule: rules.user },
      { dimension: 'ip', identifier: ip, rule: rules.ip },
    ];

    for (const check of checks) {
      if (!check.identifier || !check.rule) continue;

      const { dimension, identifier, rule } = check;

      if (rule.slidingWindow) {
        const result = await this.checkSlidingWindow({
          tenantId,
          apiId,
          dimension,
          identifier,
          rule: rule.slidingWindow,
        });

        if (result.decision !== 'ALLOW') {
          return result;
        }
      }

      if (rule.tokenBucket) {
        const result = await this.consumeToken({
          tenantId,
          apiId,
          dimension,
          identifier,
          rule: rule.tokenBucket,
        });

        if (result.decision !== 'ALLOW') {
          return result;
        }
      }
    }

    return { decision: 'ALLOW' };
  }
}
