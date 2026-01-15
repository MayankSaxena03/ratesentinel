import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.schema';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getEnv } from './config/env';
import { ApiModule } from './apis/api.module';
import { ApiKeyModule } from './api-keys/api-key.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { RedisModule } from './config/redis.module';
import { APP_GUARD } from '@nestjs/core';
import { BlockedEventsModule } from './blocked-events/blocked-events.module';
import { KillSwitchGuard } from './common/guards/kill-switch.guard';
import { RequestsLogModule } from './requests-log/requests-log.module';
import { QueuesModule } from './common/queues/queues.module';
import { BullModule } from '@nestjs/bullmq';
import { GatewayModule } from './gateway/gateway.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),

    BullModule.forRoot({
      connection: {
        host: getEnv('REDIS_HOST'),
        port: Number(getEnv('REDIS_PORT')),
      },
    }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: getEnv('MYSQL_HOST'),
      port: Number(getEnv('MYSQL_PORT')),
      username: getEnv('MYSQL_USER'),
      password: getEnv('MYSQL_PASSWORD'),
      database: getEnv('MYSQL_DB'),
      autoLoadEntities: true,
      synchronize: false,
    }),

    RedisModule,
    QueuesModule,

    HealthModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    ApiModule,
    ApiKeyModule,
    RateLimitModule,
    BlockedEventsModule,
    RequestsLogModule,
    GatewayModule,
    MetricsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: KillSwitchGuard,
    },
  ],
})
export class AppModule {}
