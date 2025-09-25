import { ensureConnection } from './client.js';
import type { RateLimitResult } from './types.js';

export interface RateLimitOptions {
  windowSeconds?: number;
  limit?: number;
  namespace?: string;
}

export async function consumeRateLimit(
  key: string,
  { windowSeconds = 60, limit = 5, namespace = 'auth' }: RateLimitOptions = {},
): Promise<RateLimitResult> {
  const redis = await ensureConnection();
  const redisKey = `${namespace}:ratelimit:${key}`;
  const current = await redis.incr(redisKey);
  if (current === 1) {
    await redis.expire(redisKey, windowSeconds);
  }
  const success = current <= limit;
  const ttl = await redis.ttl(redisKey);
  const resetIn = ttl > 0 ? ttl : windowSeconds;

  return {
    success,
    remaining: success ? limit - current : 0,
    limit,
    resetIn,
  };
}
