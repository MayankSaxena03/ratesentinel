import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RateRule, RateRuleScope } from './rate-rule.entity';
import {
  DimensionRateRule,
  RuntimeRateRules,
} from '../rate-limit/rate-limit.types';

@Injectable()
export class RateRuleService implements OnModuleInit {
  private readonly runtimeCache = new Map<number, RuntimeRateRules>();

  constructor(
    @InjectRepository(RateRule)
    private readonly rateRuleRepo: Repository<RateRule>,
  ) {}

  async onModuleInit() {
    await this.loadRuntimeRules();
  }

  async loadRuntimeRules() {
    const rules = await this.rateRuleRepo.find({
      where: { is_active: true },
    });

    this.runtimeCache.clear();

    for (const rule of rules) {
      const apiRules = this.runtimeCache.get(rule.api_id) ?? {};

      const mapped: DimensionRateRule = {
        tokenBucket: {
          capacity: rule.limit_value,
          refillRate: rule.limit_value / rule.interval_seconds,
        },
        slidingWindow: rule.burst_limit
          ? {
              windowMs: 1000,
              limit: rule.burst_limit,
            }
          : undefined,
      };

      if (rule.scope === 'api_key') apiRules.apiKey = mapped;
      if (rule.scope === 'user') apiRules.user = mapped;
      if (rule.scope === 'ip') apiRules.ip = mapped;
      if (rule.scope == 'api') apiRules.api = mapped;

      this.runtimeCache.set(rule.api_id, apiRules);
    }
  }

  getRuntimeRules(apiId: number): RuntimeRateRules | undefined {
    return this.runtimeCache.get(apiId);
  }

  async createOrUpdateRule(params: {
    apiId: number;
    scope: RateRuleScope;
    limitValue: number;
    intervalSeconds: number;
    burstLimit?: number;
  }): Promise<RateRule> {
    this.validate(params);

    const existing = await this.rateRuleRepo.findOne({
      where: {
        api_id: params.apiId,
        scope: params.scope,
      },
    });

    if (existing) {
      existing.limit_value = params.limitValue;
      existing.interval_seconds = params.intervalSeconds;
      existing.burst_limit = params.burstLimit ?? null;
      existing.is_active = true;
      return this.rateRuleRepo.save(existing);
    }

    const rule = this.rateRuleRepo.create({
      api_id: params.apiId,
      scope: params.scope,
      limit_value: params.limitValue,
      interval_seconds: params.intervalSeconds,
      burst_limit: params.burstLimit ?? null,
      is_active: true,
    });

    return this.rateRuleRepo.save(rule);
  }

  async disableRule(ruleId: number): Promise<void> {
    await this.rateRuleRepo.update({ id: ruleId }, { is_active: false });
  }

  async getRulesForApi(apiId: number): Promise<RateRule[]> {
    return this.rateRuleRepo.find({
      where: {
        api_id: apiId,
        is_active: true,
      },
    });
  }

  async listActiveRules(apiId: number): Promise<RateRule[]> {
    return this.getRulesForApi(apiId);
  }

  private validate(params: {
    limitValue: number;
    intervalSeconds: number;
    burstLimit?: number;
  }) {
    if (params.limitValue <= 0) {
      throw new BadRequestException('limit_value must be > 0');
    }

    if (params.intervalSeconds <= 0) {
      throw new BadRequestException('interval_seconds must be > 0');
    }

    if (
      params.burstLimit !== undefined &&
      params.burstLimit < params.limitValue
    ) {
      throw new BadRequestException('burst_limit must be >= limit_value');
    }
  }
}
