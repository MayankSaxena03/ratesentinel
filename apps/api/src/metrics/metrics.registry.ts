import {
  Registry,
  Counter,
  Histogram,
  collectDefaultMetrics,
} from 'prom-client';

export const registry = new Registry();

collectDefaultMetrics({ register: registry });

export const requestsAllowedTotal = new Counter({
  name: 'requests_allowed_total',
  help: 'Total number of allowed requests',
  labelNames: ['tenant_id', 'api_id'],
  registers: [registry],
});

export const requestsBlockedTotal = new Counter({
  name: 'requests_blocked_total',
  help: 'Total number of blocked requests',
  labelNames: ['tenant_id', 'api_id', 'reason'],
  registers: [registry],
});

export const requestsThrottledTotal = new Counter({
  name: 'requests_throttled_total',
  help: 'Total number of throttled requests',
  labelNames: ['tenant_id', 'api_id'],
  registers: [registry],
});

export const redisLatencyMs = new Histogram({
  name: 'redis_latency_ms',
  help: 'Redis operation latency in milliseconds',
  buckets: [1, 2, 5, 10, 20, 50],
  registers: [registry],
});

export const decisionLatencyMs = new Histogram({
  name: 'decision_latency_ms',
  help: 'Rate limit decision latency in milliseconds',
  buckets: [1, 2, 5, 10, 20],
  registers: [registry],
});
