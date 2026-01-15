import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class WorkerHealthService {
  private readonly logger = new Logger(WorkerHealthService.name);
  private readonly redis: Redis;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('REDIS_HOST');
    const port = this.config.get<number>('REDIS_PORT');

    if (!host || !port) {
      throw new Error('Redis config missing in WorkerHealthService');
    }

    this.redis = new Redis({
      host,
      port,
      lazyConnect: true,
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
  }

  async checkRedis(): Promise<void> {
    await this.redis.connect();
    await this.redis.ping();
    this.logger.log('✅ Redis connection OK');
  }
}
