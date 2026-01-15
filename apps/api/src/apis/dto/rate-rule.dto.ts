import { RateRuleScope } from '../rate-rule.entity';

export class CreateOrUpdateRateRuleDto {
  scope: RateRuleScope;
  limitValue: number;
  intervalSeconds: number;
  burstLimit?: number;
}

export class DisableRateRuleDto {
  id: number;
}
