import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import Redis from 'ioredis';

import { ABUSE_QUEUE } from './abuse.queue';
import { WorkerDataSource } from '../database/data-source';
import { BlockedEvent } from '../blocked-events/blocked-event.entity';

// Traffic spike
const SPIKE_WINDOW_SECONDS = 10;
const SPIKE_THRESHOLD = 100;
const SPIKE_BLOCK_TTL_SECONDS = 60;

// Error rate abuse
const ERROR_WINDOW_SECONDS = 60;
const ERROR_THRESHOLD = 30;
const ERROR_BLOCK_TTL_SECONDS = 120;

// Suspicious IP behavior
const IP_BREADTH_WINDOW_SECONDS = 60;
const IP_BREADTH_THRESHOLD = 5;
const IP_BREADTH_BLOCK_TTL_SECONDS = 300;

// API key misuse
const API_KEY_IP_WINDOW_SECONDS = 60;
const API_KEY_IP_THRESHOLD = 5;
const API_KEY_BLOCK_TTL_SECONDS = 300;

// Automated escalation
const BLOCK_ESCALATION_THRESHOLD = 3;
const BLOCK_ESCALATION_WINDOW_SECONDS = 600;
const ESCALATED_BLOCK_TTL_SECONDS = 1800;

const BLOCK_PERMANENT_THRESHOLD = 5;
const BLOCK_PERMANENT_WINDOW_SECONDS = 3600;

interface AbuseDetectionJob {
  tenantId: number;
  apiId: number;
  apiKeyId?: number;
  ipAddress: string;
  statusCode: number;
}

@Processor(ABUSE_QUEUE)
export class AbuseProcessor extends WorkerHost {
  private readonly logger = new Logger(AbuseProcessor.name);
  private readonly redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  });

  async process(job: Job<AbuseDetectionJob>): Promise<void> {
    const { tenantId, apiId, apiKeyId, ipAddress, statusCode } = job.data;

    await this.detectTrafficSpike(tenantId, apiId, ipAddress);
    await this.detectErrorRateAbuse(tenantId, apiId, ipAddress, statusCode);
    await this.detectSuspiciousIpBehavior(tenantId, apiId, ipAddress);

    if (apiKeyId !== undefined) {
      await this.detectApiKeyMisuse(tenantId, apiKeyId, ipAddress);
    }
  }

  private async detectTrafficSpike(
    tenantId: number,
    apiId: number,
    ip: string,
  ): Promise<void> {
    const spikeKey = `spike:ip:${tenantId}:${apiId}:${ip}`;
    const blockKey = `block:ip:${tenantId}:${ip}`;

    const count = await this.redis.incr(spikeKey);
    if (count === 1) {
      await this.redis.expire(spikeKey, SPIKE_WINDOW_SECONDS);
    }

    if (count >= SPIKE_THRESHOLD) {
      const wasSet = await this.redis.setnx(blockKey, '1');
      if (wasSet === 1) {
        await this.redis.expire(blockKey, SPIKE_BLOCK_TTL_SECONDS);
        await this.persistBlock(
          tenantId,
          apiId,
          ip,
          'traffic_spike',
          SPIKE_BLOCK_TTL_SECONDS,
        );
      }
    }
  }

  private async detectErrorRateAbuse(
    tenantId: number,
    apiId: number,
    ip: string,
    statusCode: number,
  ): Promise<void> {
    if (statusCode < 400) return;

    const errorKey = `error:ip:${tenantId}:${apiId}:${ip}`;
    const blockKey = `block:ip:${tenantId}:${ip}`;

    const count = await this.redis.incr(errorKey);
    if (count === 1) {
      await this.redis.expire(errorKey, ERROR_WINDOW_SECONDS);
    }

    if (count >= ERROR_THRESHOLD) {
      const wasSet = await this.redis.setnx(blockKey, '1');
      if (wasSet === 1) {
        await this.redis.expire(blockKey, ERROR_BLOCK_TTL_SECONDS);
        await this.persistBlock(
          tenantId,
          apiId,
          ip,
          'error_rate',
          ERROR_BLOCK_TTL_SECONDS,
        );
      }
    }
  }

  private async detectSuspiciousIpBehavior(
    tenantId: number,
    apiId: number,
    ip: string,
  ): Promise<void> {
    const breadthKey = `ip:breadth:${tenantId}:${ip}`;
    const blockKey = `block:ip:${tenantId}:${ip}`;

    await this.redis.sadd(breadthKey, apiId.toString());

    const ttl = await this.redis.ttl(breadthKey);
    if (ttl === -1) {
      await this.redis.expire(breadthKey, IP_BREADTH_WINDOW_SECONDS);
    }

    const uniqueApis = await this.redis.scard(breadthKey);

    if (uniqueApis >= IP_BREADTH_THRESHOLD) {
      const wasSet = await this.redis.setnx(blockKey, '1');
      if (wasSet === 1) {
        await this.redis.expire(blockKey, IP_BREADTH_BLOCK_TTL_SECONDS);
        await this.persistBlock(
          tenantId,
          apiId,
          ip,
          'suspicious_ip_behavior',
          IP_BREADTH_BLOCK_TTL_SECONDS,
        );
      }
    }
  }

  private async detectApiKeyMisuse(
    tenantId: number,
    apiKeyId: number,
    ip: string,
  ): Promise<void> {
    const ipSetKey = `key:ips:${tenantId}:${apiKeyId}`;
    const blockKey = `block:apikey:${tenantId}:${apiKeyId}`;

    await this.redis.sadd(ipSetKey, ip);

    const ttl = await this.redis.ttl(ipSetKey);
    if (ttl === -1) {
      await this.redis.expire(ipSetKey, API_KEY_IP_WINDOW_SECONDS);
    }

    const uniqueIps = await this.redis.scard(ipSetKey);

    if (uniqueIps >= API_KEY_IP_THRESHOLD) {
      const wasSet = await this.redis.setnx(blockKey, '1');
      if (wasSet === 1) {
        await this.redis.expire(blockKey, API_KEY_BLOCK_TTL_SECONDS);
        await this.persistBlock(
          tenantId,
          null,
          null,
          'api_key_misuse',
          API_KEY_BLOCK_TTL_SECONDS,
        );
      }
    }
  }

  private async persistBlock(
    tenantId: number,
    apiId: number | null,
    ip: string | null,
    reason: string,
    ttlSeconds: number | null,
  ): Promise<void> {
    const repo = WorkerDataSource.getRepository(BlockedEvent);
    const expiresAt = ttlSeconds
      ? new Date(Date.now() + ttlSeconds * 1000)
      : null;

    await repo.insert({
      tenant_id: tenantId,
      api_id: apiId ?? null,
      block_type: 'ip',
      identifier: ip?.toString(),
      reason,
      expires_at: expiresAt,
    });

    if (ip) {
      await this.handleBlockEscalation(tenantId, ip);
    }

    this.logger.warn(
      `BLOCK persisted → tenant=${tenantId} api=${apiId ?? '-'} ip=${ip ?? '-'} reason=${reason}`,
    );
  }

  private async handleBlockEscalation(
    tenantId: number,
    ip: string,
  ): Promise<void> {
    const countKey = `block:count:ip:${tenantId}:${ip}`;
    const permanentKey = `block:permanent:ip:${tenantId}:${ip}`;
    const blockKey = `block:ip:${tenantId}:${ip}`;

    const count = await this.redis.incr(countKey);
    if (count === 1) {
      await this.redis.expire(countKey, BLOCK_PERMANENT_WINDOW_SECONDS);
    }

    if (count >= BLOCK_PERMANENT_THRESHOLD) {
      const wasSet = await this.redis.setnx(permanentKey, '1');
      if (wasSet === 1) {
        await this.redis.set(blockKey, '1');
        await this.persistBlock(
          tenantId,
          null,
          ip,
          'permanent_block_escalation',
          null,
        );

        this.logger.error(`PERMANENT BLOCK → tenant=${tenantId} ip=${ip}`);
      }
      return;
    }

    if (count >= BLOCK_ESCALATION_THRESHOLD) {
      await this.redis.set(blockKey, '1');
      await this.redis.expire(blockKey, ESCALATED_BLOCK_TTL_SECONDS);

      this.logger.warn(
        `ESCALATED BLOCK → tenant=${tenantId} ip=${ip} ttl=${ESCALATED_BLOCK_TTL_SECONDS}s`,
      );
    }
  }
}
