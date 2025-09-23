---
file: apps/web/README.md
title: apps/web 개발 안내
owner: duksan
created: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
updated: 2025-09-23 06:36 UTC / 2025-09-23 15:36 KST
status: active
tags: [docs, setup]
schemaVersion: 1
description: Next.js 관리자 프론트엔드 앱 실행 및 개발 지침
code_refs:
  [
    'apps/web/src/app/admin/dashboard/page.tsx',
    'apps/web/src/app/admin/wiki/page.tsx',
    'apps/web/src/app/admin/timeline/page.tsx',
    'apps/web/src/app/admin/graph/page.tsx',
    'apps/web/src/app/admin/tech-debt/page.tsx',
    'apps/web/src/app/admin/layout.tsx',
    'apps/web/src/app/admin/wiki/search-client.tsx',
    'apps/web/src/app/api/documents/search/route.ts',
    'apps/web/sentry.client.config.ts',
    'apps/web/sentry.config.ts',
    'apps/web/instrumentation.ts',
    'apps/web/next.config.ts',
  ]
doc_refs: ['admin/plan/m1-kickoff.md', 'basesettings.md']
---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Install dependencies from the repo root (pnpm workspace):

```bash
pnpm install
```

Then run the development server for the web app:

```bash
pnpm --filter web dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Next Steps

- `/admin/dashboard`, `/admin/wiki`, `/admin/timeline`, `/admin/graph`, `/admin/tech-debt` 라우트에 샘플 데이터가 연결되어 있습니다.
- 관리자 Wiki는 `/api/documents/search`·`/documents` API와 연동되어 검색·필터 기능을 점진적으로 확장합니다.
- 브라우저 에러 트래킹이 필요하면 `NEXT_PUBLIC_ENABLE_SENTRY=true`와 `NEXT_PUBLIC_SENTRY_DSN`을 설정합니다.
- 문서나 데이터 구조가 바뀔 때마다 `pnpm run validate:docs`와 `pnpm run validate:refs`로 검증하세요.

## Observability

- 클라이언트/서버/Edge 런타임에서 `@sentry/nextjs`가 초기화됩니다.
- 환경 변수: `NEXT_PUBLIC_ENABLE_SENTRY`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_ENVIRONMENT`, `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`, `NEXT_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE`.

## Scripts

```bash
pnpm --filter web lint   # ESLint
pnpm --filter web build  # Next.js production build
```
