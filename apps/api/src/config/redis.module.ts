import { Module, Global } from '@nestjs/common';
import { Redis } from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: Redis,
      useFactory: () => {
        const redis = new Redis({
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT),
          password: process.env.REDIS_PASSWORD,
          tls: {},
          connectTimeout: 3000,
          maxRetriesPerRequest: 1,
          retryStrategy: (times) => {
            if (times > 3) return null;
            return Math.min(times * 200, 1000);
          },
        });

        redis.on('connect', () => {
          console.log('[REDIS] connected');
        });

        redis.on('error', (err) => {
          console.error('[REDIS] error', err.message);
        });

        return redis;
      },
    },
  ],
  exports: [Redis],
})
export class RedisModule {}
