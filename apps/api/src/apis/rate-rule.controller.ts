import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { TenantGuard } from 'src/tenants/guards/tenant.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RateRuleService } from './rate-rule.service';
import {
  CreateOrUpdateRateRuleDto,
  DisableRateRuleDto,
} from './dto/rate-rule.dto';
import { ApiService } from './api.service';

@Controller('apis/:apiId/rate-rules')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class RateRuleController {
  constructor(
    private readonly rateRuleService: RateRuleService,
    private readonly apiService: ApiService,
  ) {}

  @Post()
  @Roles('admin')
  async createOrUpdateRule(
    @CurrentTenant() tenantId: number,
    @Param('apiId', ParseIntPipe) apiId: number,
    @Body() dto: CreateOrUpdateRateRuleDto,
  ) {
    await this.apiService.findOne(tenantId, apiId);

    return this.rateRuleService.createOrUpdateRule({
      apiId,
      scope: dto.scope,
      limitValue: dto.limitValue,
      intervalSeconds: dto.intervalSeconds,
      burstLimit: dto.burstLimit,
    });
  }

  @Patch('disable')
  @Roles('admin')
  async disableRule(
    @CurrentTenant() tenantId: number,
    @Param('apiId', ParseIntPipe) apiId: number,
    @Body() dto: DisableRateRuleDto,
  ) {
    await this.apiService.findOne(tenantId, apiId);
    return this.rateRuleService.disableRule(dto.id);
  }

  @Get()
  @Roles('admin', 'developer')
  async listActiveRules(
    @CurrentTenant() tenantId: number,
    @Param('apiId', ParseIntPipe) apiId: number,
  ) {
    await this.apiService.findOne(tenantId, apiId);
    return this.rateRuleService.listActiveRules(apiId);
  }
}
