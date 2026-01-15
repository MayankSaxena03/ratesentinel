import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestsLogEntity } from './requests-log.entity';
import { RequestsLogService } from './requests-log.service';
import { RequestsLogController } from './requests-log.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RequestsLogEntity])],
  providers: [RequestsLogService],
  controllers: [RequestsLogController],
})
export class RequestsLogModule {}
