export type RateLimitDecision =
  | { decision: 'ALLOW' }
  | { decision: 'THROTTLE'; retryAfterMs: number }
  | { decision: 'BLOCK'; reason: string };

export interface TokenBucketRule {
  capacity: number;
  refillRate: number;
}

export interface SlidingWindowRule {
  windowMs: number;
  limit: number;
}

export interface DimensionRateRule {
  slidingWindow?: SlidingWindowRule;
  tokenBucket?: TokenBucketRule;
}

export interface RuntimeRateRules {
  api?: DimensionRateRule;
  apiKey?: DimensionRateRule;
  user?: DimensionRateRule;
  ip?: DimensionRateRule;
}
