import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Api } from './api.entity';
import { ApiService } from './api.service';
import { ApiController } from './api.controller';
import { RateRule } from './rate-rule.entity';
import { RateRuleService } from './rate-rule.service';
import { RateRuleController } from './rate-rule.controller';
import { TenantsModule } from 'src/tenants/tenants.module';

@Module({
  imports: [TypeOrmModule.forFeature([Api, RateRule]), TenantsModule],
  providers: [ApiService, RateRuleService],
  controllers: [ApiController, RateRuleController],
  exports: [RateRuleService, ApiService],
})
export class ApiModule {}
