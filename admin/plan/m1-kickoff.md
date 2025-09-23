---
file: admin/plan/m1-kickoff.md
title: 관리자 페이지 MVP 착수 계획(M0-0/M0-3/M1)
owner: duksan
created: 2025-09-22 15:05 UTC / 2025-09-23 00:05 KST
updated: 2025-09-23 05:32 UTC / 2025-09-23 14:32 KST
status: ready
tags: [plan, mvp, web, api, ci]
schemaVersion: 1
description: 베이스 세팅 이후 실제 앱/서버/CI 골조를 세우기 위한 실행 계획과 수용 기준, 새 채팅 트리거 문구를 정의
code_refs:
  [
    'scripts/validate_docs.sh',
    'scripts/validate_refs.sh',
    'scripts/validate_migrations.sh',
    'scripts/validate_code_headers.sh',
    'scripts/validate_sidecar_meta.sh',
    'package.json',
    'pnpm-workspace.yaml',
    'turbo.json',
    '.editorconfig',
    '.nvmrc',
    'eslint.config.js',
    'prettier.config.cjs',
    'lint-staged.config.cjs',
    '.husky/pre-commit',
    '.gitignore',
    '.github/workflows/build.yml',
    'scripts/gh_protect_main.sh',
    'apps/web/src/app/admin/layout.tsx',
    'apps/web/src/app/admin/dashboard/page.tsx',
    'apps/web/src/app/admin/wiki/page.tsx',
    'apps/web/src/app/admin/wiki/search-client.tsx',
    'apps/web/src/app/admin/timeline/page.tsx',
    'apps/web/src/app/admin/graph/page.tsx',
    'apps/web/src/app/admin/tech-debt/page.tsx',
    'apps/web/src/app/api/documents/search/route.ts',
    'apps/api/src/main.ts',
    'apps/api/src/app.module.ts',
    'apps/api/src/app.controller.ts',
    'apps/api/src/app.service.ts',
    'apps/api/src/metrics.service.ts',
    'apps/api/src/observability.ts',
    'apps/api/src/documents/documents.module.ts',
    'apps/api/src/documents/documents.controller.ts',
    'apps/api/src/documents/documents.service.ts',
    'apps/api/test/run-smoke.js',
    'packages/documents/src/index.ts',
    'packages/documents/src/repository.ts',
    'packages/documents/src/search.ts',
    'packages/documents/src/list.ts',
    'packages/documents/src/types.ts',
  ]
---

# 목표

- 운영·검증·보안 뼈대(R1~R11)가 준비된 상태에서, 관리자 페이지 MVP의 앱/서버/CI 골조를 단계적으로 완성한다.

# 작업 범위와 수용 기준

## M0-0 — 리포/도구 체계 확립

- 해야 할 일
  - pnpm + Turborepo 모노레포 초기화(루트 package.json, turbo.json)
  - .nvmrc(LTS), .editorconfig, eslint/prettier 기본 설정
  - husky+lint-staged로 프리커밋 훅 이관 또는 병행(현재 .githooks 유지 가능)
  - .gitignore 확장(빌드 산출물/캐시 등)
- 수용 기준
  - pnpm install이 성공, turbo run lint/build 파이프라인이 동작
  - 프리커밋에서 포맷/린트가 동작하고, 실패 시 커밋 차단
- 진행 상황
  - [완료] 2025-09-22 15:21 UTC / 2025-09-23 00:21 KST — 모노레포(pnpm+turbo) 초기화 및 개발 도구 설정(package.json, pnpm-workspace.yaml, turbo.json, .editorconfig, .nvmrc, eslint.config.js, prettier.config.cjs, lint-staged.config.cjs, .husky/pre-commit, .gitignore)

## M0-3 — CI 빌드 파이프라인(초기)

- 해야 할 일
  - .github/workflows/build.yml 신설: web/api에 대해 install/lint/typecheck/build
  - 캐시 설정(pnpm), 병렬 잡 구성
- 수용 기준
  - PR에서 build 잡이 통과해야만 머지 가능(요건 명시)
- 진행 상황
  - [완료] 2025-09-22 15:32 UTC / 2025-09-23 00:32 KST — CI build 워크플로(.github/workflows/build.yml) 추가, pnpm lint/typecheck/build 스크립트 확장, Turbo 파이프라인(typecheck) 구성

## M0-4 — 샘플 데이터(선택적 선행)

- 해야 할 일
  - 간트(Mermaid) 샘플 1개, 그래프(JSON) 샘플 1개, KPI 목업 1개 추가
  - admin/wiki 또는 /admin/timeline에 연동 예정 데이터 포맷 문서화
- 수용 기준
  - 샘플 데이터 파일이 레포에 존재하고, 로더가 읽을 수 있는 포맷
- 진행 상황
  - [완료] 2025-09-22 19:05 UTC / 2025-09-23 04:05 KST — admin/data/ 디렉터리에 timeline.gantt.md, graph.json, kpi.md를 추가하고 README로 사용 가이드를 문서화

## M1-0/1/2 — 프론트(Web) 골조

- 해야 할 일
  - apps/web(Next.js 14) 부트스트랩
  - /admin/dashboard | /admin/wiki | /admin/timeline | /admin/graph | /admin/tech-debt 라우팅 골격
  - Markdown+Frontmatter 로더(백링크/태그/상태 배지 표시 최소)
- 수용 기준
  - dev 서버 구동, 각 라우트가 200으로 스켈레톤 화면 표시
- 진행 상황
  - [완료] 2025-09-22 19:20 UTC / 2025-09-23 04:20 KST — Next.js 14 부트스트랩, /admin/\* 라우트 및 Markdown 로더 연결

## M1-5/6 — API/관측 골조

- 해야 할 일
  - apps/api(NestJS + Fastify) 스켈레톤
  - /healthz 200, /metrics 노출(기본 메트릭), Sentry/OTel 토글
- 수용 기준
  - 로컬에서 서버 구동 및 엔드포인트 응답 확인
- 진행 상황
  - [완료] 2025-09-22 19:25 UTC / 2025-09-23 04:25 KST — NestJS Fastify 스켈레톤, /healthz · /ready · /metrics 구현 및 관측 토글 추가

# 새 채팅 트리거 문구(선택 실행)

- 실행하라: M0-0 리포/도구 체계 세팅
- 실행하라: M0-3 CI 빌드 파이프라인 구성
- 실행하라: M0-4 샘플 데이터 추가
- 실행하라: M1-0 Next.js 부트스트랩
- 실행하라: M1-1 관리자 라우팅 골격
- 실행하라: M1-2 문서 로더 구현
- 실행하라: M1-5 API 스켈레톤
- 실행하라: M1-6 관측 베이스(헬스/메트릭/토글)

# 참고

- 본 문서 준비 이후에는 위 트리거 중 하나를 새 채팅 첫 메시지로 입력하여 해당 작업만 집중 수행할 수 있다.
