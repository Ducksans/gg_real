/**
 * file: apps/web/src/lib/redis-adapter.ts
 * owner: duksan
 * created: 2025-09-25 06:20 UTC / 2025-09-25 15:20 KST
 * purpose: Minimal Redis-backed Auth.js adapter supporting email magic-link login
 * doc_refs: ['admin/docs/auth-rbac.md', 'admin/runbooks/auth.md']
 */

import crypto from 'node:crypto';
import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
  VerificationToken,
} from 'next-auth/adapters';
import type { RedisClientType } from 'redis';
import { ensureConnection, getRedisKey } from '@gg-real/session';

const USER_KEY = (id: string) => getRedisKey(`auth:user:${id}`);
const EMAIL_KEY = (email: string) => getRedisKey(`auth:user:email:${email.toLowerCase()}`);
const ACCOUNT_KEY = (provider: string, id: string) => getRedisKey(`auth:account:${provider}:${id}`);
const ACCOUNT_DATA_KEY = (provider: string, id: string) =>
  getRedisKey(`auth:account:data:${provider}:${id}`);
const SESSION_KEY = (token: string) => getRedisKey(`auth:session:${token}`);
const VERIFICATION_KEY = (token: string) => getRedisKey(`auth:verification:${token}`);

function ttlFromDate(expires: Date): number {
  return Math.max(0, expires.getTime() - Date.now());
}

async function client(): Promise<RedisClientType> {
  return ensureConnection();
}

async function readUser(id: string): Promise<AdapterUser | null> {
  const payload = await (await client()).get(USER_KEY(id));
  return payload ? (JSON.parse(payload) as AdapterUser) : null;
}

async function writeUser(user: AdapterUser): Promise<void> {
  const redis = await client();
  await redis.set(USER_KEY(user.id!), JSON.stringify(user));
  if (user.email) {
    await redis.set(EMAIL_KEY(user.email), user.id!);
  }
}

async function removeUser(user: AdapterUser | null): Promise<void> {
  if (!user?.id) return;
  const redis = await client();
  await redis.del(USER_KEY(user.id));
  if (user.email) {
    await redis.del(EMAIL_KEY(user.email));
  }
}

async function writeAccount(account: AdapterAccount): Promise<void> {
  const redis = await client();
  await redis.set(ACCOUNT_KEY(account.provider, account.providerAccountId), account.userId);
  await redis.set(
    ACCOUNT_DATA_KEY(account.provider, account.providerAccountId),
    JSON.stringify(account),
  );
}

async function removeAccount(provider: string, providerAccountId: string): Promise<void> {
  const redis = await client();
  await redis.del(ACCOUNT_KEY(provider, providerAccountId));
  await redis.del(ACCOUNT_DATA_KEY(provider, providerAccountId));
}

async function readSession(sessionToken: string): Promise<AdapterSession | null> {
  const payload = await (await client()).get(SESSION_KEY(sessionToken));
  return payload ? (JSON.parse(payload) as AdapterSession) : null;
}

async function writeSession(session: AdapterSession): Promise<void> {
  const redis = await client();
  const expires = session.expires ?? new Date(Date.now() + 86400 * 1000);
  await redis.set(SESSION_KEY(session.sessionToken), JSON.stringify(session), {
    PX: ttlFromDate(new Date(expires)),
  });
}

async function removeSession(sessionToken: string): Promise<void> {
  await (await client()).del(SESSION_KEY(sessionToken));
}

async function readVerificationToken(token: string): Promise<VerificationToken | null> {
  const payload = await (await client()).get(VERIFICATION_KEY(token));
  return payload ? (JSON.parse(payload) as VerificationToken) : null;
}

async function writeVerificationToken(token: VerificationToken): Promise<void> {
  const redis = await client();
  await redis.set(VERIFICATION_KEY(token.token), JSON.stringify(token), {
    PX: ttlFromDate(token.expires),
  });
}

async function removeVerificationToken(token: string): Promise<void> {
  await (await client()).del(VERIFICATION_KEY(token));
}

export function createRedisAdapter(): Adapter {
  const adapter: Adapter = {
    createUser: async (user) => {
      const id = user.id ?? crypto.randomUUID();
      const record: AdapterUser = { ...user, id };
      await writeUser(record);
      return record;
    },

    getUser: async (id) => {
      return readUser(id);
    },

    getUserByEmail: async (email) => {
      const userId = await (await client()).get(EMAIL_KEY(email));
      if (!userId) return null;
      return readUser(userId);
    },

    getUserByAccount: async ({ provider, providerAccountId }) => {
      const userId = await (await client()).get(ACCOUNT_KEY(provider, providerAccountId));
      if (!userId) return null;
      return readUser(userId);
    },

    updateUser: async (user) => {
      if (!user.id) throw new Error('User id is required to update user');
      const existing = await readUser(user.id);
      if (!existing) throw new Error('User not found');
      const merged: AdapterUser = { ...existing, ...user };
      await writeUser(merged);
      return merged;
    },

    deleteUser: async (id) => {
      const existing = await readUser(id);
      await removeUser(existing);
    },

    linkAccount: async (account) => {
      await writeAccount(account as AdapterAccount);
      return account as AdapterAccount;
    },

    unlinkAccount: async ({ provider, providerAccountId }) => {
      await removeAccount(provider, providerAccountId);
    },

    createSession: async (session) => {
      const record: AdapterSession = {
        ...session,
        sessionToken: session.sessionToken ?? crypto.randomUUID(),
        expires: session.expires ?? new Date(Date.now() + 86400 * 1000),
      };
      await writeSession(record);
      return record;
    },

    getSessionAndUser: async (sessionToken) => {
      const session = await readSession(sessionToken);
      if (!session) return null;
      const user = await readUser(session.userId);
      if (!user) return null;
      return { session, user };
    },

    updateSession: async (session) => {
      const existing = await readSession(session.sessionToken);
      if (!existing) return null;
      const merged: AdapterSession = {
        ...existing,
        ...session,
        expires: session.expires ?? existing.expires,
      };
      await writeSession(merged);
      return merged;
    },

    deleteSession: async (sessionToken) => {
      await removeSession(sessionToken);
    },

    createVerificationToken: async (token) => {
      await writeVerificationToken(token);
      return token;
    },

    useVerificationToken: async ({ identifier, token }) => {
      const stored = await readVerificationToken(token);
      if (!stored) return null;
      await removeVerificationToken(token);
      if (identifier && stored.identifier !== identifier) {
        return null;
      }
      return stored;
    },
  };

  return adapter;
}
