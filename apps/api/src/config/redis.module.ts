import { Module, Global } from '@nestjs/common';
import { Redis } from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: Redis,
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT),
          password: process.env.REDIS_PASSWORD,
          lazyConnect: false,
          connectTimeout: 3000,
          maxRetriesPerRequest: 1,
          retryStrategy: () => null,
        });
      },
    },
  ],
  exports: [Redis],
})
export class RedisModule {}
