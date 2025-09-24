/**
 * file: apps/web/instrumentation.ts
 * owner: duksan
 * created: 2025-09-23 06:12 UTC / 2025-09-23 15:12 KST
 * updated: 2025-09-23 06:33 UTC / 2025-09-23 15:33 KST
 * purpose: Next.js 서버/Edge 환경에서 Sentry를 초기화하는 instrumentation hook
 * doc_refs: ["apps/web/README.md", "basesettings.md", "admin/plan/m1-kickoff.md"]
 */

import * as Sentry from '@sentry/nextjs';

export async function register() {
  const enableServer =
    process.env.ENABLE_SENTRY === 'true' || process.env.NEXT_PUBLIC_ENABLE_SENTRY === 'true';
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!enableServer || !dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number.parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    profilesSampleRate: Number.parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? '0.1'),
  });
}
