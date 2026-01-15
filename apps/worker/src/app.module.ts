import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.schema';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { WorkerQueuesModule } from './queues/worker-queues.module';
import { WorkerHealthService } from './health/health.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestsLogEntity } from './entities/requests-log.entity';
import { S3Module } from './s3/s3.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
        },
      }),
    }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT),
      username: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB,
      autoLoadEntities: true,
      synchronize: false,
    }),

    TypeOrmModule.forFeature([RequestsLogEntity]),

    WorkerQueuesModule,

    S3Module,
  ],
  providers: [WorkerHealthService],
})
export class AppModule {}
