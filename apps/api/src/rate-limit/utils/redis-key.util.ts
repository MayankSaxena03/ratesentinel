export type RateLimitDimension = 'api' | 'api_key' | 'user' | 'ip';

export function buildTokenBucketKey(params: {
  tenantId: number;
  apiId: number;
  dimension: RateLimitDimension;
  identifier: string | number;
}) {
  const { tenantId, apiId, dimension, identifier } = params;
  return `rl:${tenantId}:${apiId}:${dimension}:${identifier}:bucket`;
}
