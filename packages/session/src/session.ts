import { ensureConnection, getRedisKey } from './client.js';
import type { StoredSession } from './types.js';

const DEFAULT_TTL_SECONDS = Number.parseInt(process.env.REDIS_SESSION_TTL ?? '86400', 10);

export async function setSession(
  id: string,
  value: StoredSession,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<void> {
  const redis = await ensureConnection();
  const key = getRedisKey(id);
  await redis.set(key, JSON.stringify(value), {
    EX: ttlSeconds,
  });
}

export async function getSession(id: string): Promise<StoredSession | null> {
  const redis = await ensureConnection();
  const key = getRedisKey(id);
  const payload = await redis.get(key);
  return payload ? (JSON.parse(payload) as StoredSession) : null;
}

export async function clearSession(id: string): Promise<void> {
  const redis = await ensureConnection();
  const key = getRedisKey(id);
  await redis.del(key);
}
