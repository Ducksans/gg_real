/**
 * file: apps/web/sentry.config.ts
 * owner: duksan
 * created: 2025-09-23 05:57 UTC / 2025-09-23 14:57 KST
 * updated: 2025-09-23 05:57 UTC / 2025-09-23 14:57 KST
 * purpose: Sentry Next.js 설정(업로드 비활성화/옵션 제어)
 * doc_refs: ["apps/web/README.md", "basesettings.md", "admin/plan/m1-kickoff.md"]
 */

const config = {
  silent: true,
  org: process.env.SENTRY_ORG ?? undefined,
  project: process.env.SENTRY_PROJECT ?? undefined,
};

export default config;
