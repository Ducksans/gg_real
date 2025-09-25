/**
 * file: apps/web/src/lib/auth.ts
 * owner: duksan
 * created: 2025-09-25 05:55 UTC / 2025-09-25 14:55 KST
 * purpose: NextAuth(Auth.js) 설정과 이메일 Magic Link provider, Redis 세션 연동 헬퍼
 * doc_refs: ['admin/docs/auth-rbac.md', '.env.example', 'admin/runbooks/auth.md']
 */

import nodemailer from 'nodemailer';
import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import {
  resolveRoleForEmail,
  roleSatisfies,
  setSession,
  getSession,
  clearSession,
  type StoredSession,
} from '@gg-real/session';
import { createRedisAdapter } from './redis-adapter';
import type { UserRole } from '@gg-real/session';

const SESSION_TTL_SECONDS = Number.parseInt(process.env.REDIS_SESSION_TTL ?? '86400', 10);
const DEFAULT_FROM = process.env.AUTH_EMAIL_FROM?.trim() || 'no-reply@gg-real.local';
const EMAIL_SERVER = process.env.AUTH_EMAIL_SERVER?.trim() || undefined;
const AUTH_SECRET =
  process.env.AUTH_SECRET?.trim() ||
  process.env.NEXTAUTH_SECRET?.trim() ||
  (process.env.NODE_ENV === 'production' ? undefined : 'dev-secret');

if (!AUTH_SECRET) {
  console.warn('[auth] Missing AUTH_SECRET in production environment.');
}

function createTransport() {
  if (EMAIL_SERVER) {
    return nodemailer.createTransport(EMAIL_SERVER);
  }
  return nodemailer.createTransport({ jsonTransport: true });
}

async function sendMagicLink({ identifier, url }: { identifier: string; url: string }) {
  try {
    const transport = createTransport();
    const info = await transport.sendMail({
      to: identifier,
      from: DEFAULT_FROM,
      subject: 'GG Real 관리자 로그인 링크',
      text: `아래 링크를 클릭하여 로그인하세요.\n\n${url}\n\n이 메일이 요청되지 않았다면 무시해 주세요.`,
    });
    if (!EMAIL_SERVER) {
      console.info('[auth] Magic Link payload (development transport)', {
        identifier,
        url,
        info,
      });
    }
  } catch (error) {
    console.error('[auth] Failed to send magic link', error);
    throw error;
  }
}

function determineRole(email?: string | null): UserRole {
  return resolveRoleForEmail(email ?? undefined);
}

async function persistSession(tokenSub: string, email: string, role: UserRole): Promise<void> {
  const payload: StoredSession = {
    userId: tokenSub,
    email,
    role,
    expires: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  await setSession(tokenSub, payload, SESSION_TTL_SECONDS);
}

const emailProvider = EmailProvider({
  from: DEFAULT_FROM,
  server: EMAIL_SERVER ?? { jsonTransport: true },
  async sendVerificationRequest({ identifier, url }) {
    await sendMagicLink({ identifier, url });
  },
});

// EmailProvider ignores the provided server configuration, so force override.
emailProvider.server = EMAIL_SERVER ?? { jsonTransport: true };
console.info(
  '[auth] provider type',
  typeof emailProvider.sendVerificationRequest,
  emailProvider.server,
);

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  trustHost: true,
  secret: AUTH_SECRET,
  adapter: createRedisAdapter(),
  session: {
    strategy: 'jwt',
    maxAge: SESSION_TTL_SECONDS,
  },
  providers: [emailProvider],
  debug: process.env.NODE_ENV !== 'production',
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        const role = determineRole(user.email);
        if (token.sub) {
          await persistSession(token.sub, user.email, role);
        }
        token.role = role;
        return token;
      }

      if (token.sub) {
        const stored = await getSession(token.sub);
        if (stored) {
          token.role = stored.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as UserRole | undefined) ?? 'viewer';
      }
      return session;
    },
    async authorized({ request, auth: authSession }) {
      if (!authSession?.user) {
        return false;
      }
      const requiredRole = request?.nextUrl?.searchParams?.get('role');
      if (!requiredRole) {
        return true;
      }
      const role = authSession.user.role ?? 'viewer';
      return roleSatisfies(role, requiredRole as UserRole);
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.sub) {
        await clearSession(token.sub);
      }
    },
    async error(error) {
      console.error('[auth] error', error, error instanceof Error ? error.stack : undefined);
    },
  },
});
