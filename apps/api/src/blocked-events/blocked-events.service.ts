import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Redis } from 'ioredis';
import { BlockedEvent } from './blocked-event.entity';

@Injectable()
export class BlockedEventsService {
  constructor(
    private readonly redis: Redis,
    @InjectRepository(BlockedEvent)
    private readonly repo: Repository<BlockedEvent>,
  ) {}

  private redisKey(tenantId: number, type: string, identifier: string): string {
    return `block:${tenantId}:${type}:${identifier}`;
  }

  async create(
    tenantId: number,
    dto: {
      block_type: 'ip' | 'api_key' | 'user' | 'global';
      identifier: string;
      reason: string;
      api_id?: number;
      expires_at?: string;
    },
  ): Promise<void> {
    const expiresAt = dto.expires_at ? new Date(dto.expires_at) : null;

    const event = this.repo.create({
      tenant_id: tenantId,
      api_id: dto.api_id ?? null,
      block_type: dto.block_type,
      identifier: dto.identifier,
      reason: dto.reason,
      expires_at: expiresAt,
    });

    await this.repo.save(event);

    const key = this.redisKey(tenantId, dto.block_type, dto.identifier);

    if (expiresAt) {
      const ttlSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

      if (ttlSeconds > 0) {
        await this.redis.set(key, '1', 'EX', ttlSeconds);
      }

      return;
    }

    await this.redis.set(key, '1');
  }

  async isBlocked(
    tenantId: number,
    type: string,
    identifier: string,
  ): Promise<boolean> {
    const key = this.redisKey(tenantId, type, identifier);
    return (await this.redis.get(key)) === '1';
  }

  async unblockById(tenantId: number, id: number): Promise<void> {
    const event = await this.repo.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!event || event.unblocked_at) return;

    const key = this.redisKey(tenantId, event.block_type, event.identifier);

    await this.redis.del(key);

    await this.repo.update({ id }, { unblocked_at: new Date() });
  }

  async listActive(tenantId: number) {
    return this.repo.find({
      where: {
        tenant_id: tenantId,
        unblocked_at: IsNull(),
      },
      order: { created_at: 'DESC' },
    });
  }

  async unblockByEntity(
    tenantId: number,
    blockType: 'ip' | 'api_key' | 'user' | 'global',
    identifier: string,
  ): Promise<void> {
    const key = this.redisKey(tenantId, blockType, identifier);

    await this.redis.del(key);

    await this.repo.update(
      {
        tenant_id: tenantId,
        block_type: blockType,
        identifier,
        unblocked_at: IsNull(),
      },
      {
        unblocked_at: new Date(),
      },
    );
  }
}
