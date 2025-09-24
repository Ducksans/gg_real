/**
 * file: apps/web/sentry.client.config.ts
 * owner: duksan
 * created: 2025-09-23 05:57 UTC / 2025-09-23 14:57 KST
 * updated: 2025-09-23 06:33 UTC / 2025-09-23 15:33 KST
 * purpose: Next.js 클라이언트 런타임에서 Sentry를 초기화합니다.
 * doc_refs: ["apps/web/README.md", "basesettings.md", "admin/plan/m1-kickoff.md"]
 */

import * as Sentry from '@sentry/nextjs';

const enabled = process.env.NEXT_PUBLIC_ENABLE_SENTRY === 'true';
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (enabled && dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number.parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    profilesSampleRate: Number.parseFloat(
      process.env.NEXT_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE ?? '0.1',
    ),
  });
}
