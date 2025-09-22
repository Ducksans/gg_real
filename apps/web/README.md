---
file: apps/web/README.md
title: apps/web 개발 안내
owner: duksan
created: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
updated: 2025-09-22 20:02 UTC / 2025-09-23 05:02 KST
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
- 문서나 데이터 구조가 바뀔 때마다 `pnpm run validate:docs`와 `pnpm run validate:refs`로 검증하세요.

## Scripts

```bash
pnpm --filter web lint   # ESLint
pnpm --filter web build  # Next.js production build
```
