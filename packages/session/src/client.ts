import { createClient, type RedisClientType } from 'redis';

let client: RedisClientType | undefined;

function getRedisUrl(): string {
  return process.env.REDIS_URL ?? 'redis://localhost:6379';
}

export function getRedisClient(): RedisClientType {
  if (!client) {
    client = createClient({ url: getRedisUrl() });
    client.on('error', (error: unknown) => {
      console.error('[session] Redis client error', error);
    });
    void client.connect();
  }
  return client;
}

export async function ensureConnection(): Promise<RedisClientType> {
  const instance = getRedisClient();
  if (!instance.isOpen) {
    await instance.connect();
  }
  return instance;
}

export function getRedisKey(key: string): string {
  return key.startsWith('session:') ? key : `session:${key}`;
}
