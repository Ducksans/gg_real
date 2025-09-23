/**
 * file: apps/web/next.config.ts
 * owner: duksan
 * created: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * updated: 2025-09-23 06:33 UTC / 2025-09-23 15:33 KST
 * purpose: Next.js 애플리케이션 기본 설정 및 Sentry 플러그인 토글
 * doc_refs: ["apps/web/README.md", "basesettings.md", "admin/plan/m1-kickoff.md"]
 */

import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  /* config options here */
};

const enableSentryPlugins =
  process.env.ENABLE_SENTRY === 'true' || process.env.NEXT_PUBLIC_ENABLE_SENTRY === 'true';

export default enableSentryPlugins ? withSentryConfig(nextConfig, { silent: true }) : nextConfig;
