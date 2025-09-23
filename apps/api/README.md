---
file: apps/api/README.md
title: apps/api 개발 안내
owner: duksan
created: 2025-09-22 19:25 UTC / 2025-09-23 04:25 KST
updated: 2025-09-23 06:36 UTC / 2025-09-23 15:36 KST
status: active
tags: [docs, api]
schemaVersion: 1
description: NestJS 기반 관리자 API 실행 및 관측 토글 가이드
code_refs:
  [
    'apps/api/src/main.ts',
    'apps/api/src/app.module.ts',
    'apps/api/src/app.controller.ts',
    'apps/api/src/app.service.ts',
    'apps/api/src/metrics.service.ts',
    'apps/api/src/observability.ts',
    'apps/api/test/health.spec.ts',
    'apps/api/src/documents/documents.module.ts',
    'apps/api/src/documents/documents.controller.ts',
    'apps/api/src/documents/documents.service.ts',
    'apps/api/src/filters/sentry.filter.ts',
    'apps/api/test/run-smoke.js',
  ]
doc_refs: ['admin/plan/m1-kickoff.md', 'basesettings.md']
---

## 설치 및 실행

```bash
pnpm install
pnpm --filter api dev        # watch 모드
pnpm --filter api start:prod # production 빌드
```

서버는 기본적으로 `http://localhost:3001`에서 동작합니다. 포트는 `PORT` 환경 변수로 조정할 수 있습니다.

## 엔드포인트

- `GET /healthz` — Terminus를 이용한 기본 헬스 체크(`status: ok`)
- `GET /ready` — 버전과 timestamp를 포함한 준비 상태 확인
- `GET /metrics` — 프로세스 uptime, memory usage 등을 JSON으로 반환 (후속 단계에서 Prometheus 포맷으로 확장 예정)
- `GET /documents` — 문서 목록을 페이지네이션해 반환(tag/status 필터 지원)
- `GET /documents/search` — 키워드 기반 검색 및 백링크 정보를 포함해 반환
- `GET /documents/stats` — 상태·태그별 문서 집계를 제공

## 관측 토글

`scripts/observability.ts`는 Sentry(`ENABLE_SENTRY=true`)와 OpenTelemetry(`ENABLE_OTEL=true`)를 초기화합니다. Sentry DSN과 샘플링 비율(`SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE`, `SENTRY_PROFILES_SAMPLE_RATE`)을 환경 변수로 지정하고, OpenTelemetry는 OTLP 수집기가 없으면 콘솔로 스팬을 내보냅니다.

### 주요 환경 변수

- `ENABLE_SENTRY` / `SENTRY_DSN` / `SENTRY_ENVIRONMENT`
- `SENTRY_TRACES_SAMPLE_RATE` / `SENTRY_PROFILES_SAMPLE_RATE`
- `ENABLE_OTEL` / `OTEL_SERVICE_NAME`
- `OTEL_EXPORTER_OTLP_ENDPOINT` / `OTEL_EXPORTER_OTLP_HEADERS`

## 폴더 구조

- `src/` — NestJS 애플리케이션 코드
  - `main.ts` 부트스트랩, `app.controller.ts` 엔드포인트, `metrics.service.ts` 메트릭 수집
  - `observability.ts` 관측 초기화 토글
- `test/` 및 e2e 스펙은 향후 필요 시 추가합니다.

## TODO

- Prometheus 포맷 메트릭 변환
- 문서 API 필터 UI와 자동화 시나리오(Playwright/Postman) 확장

## 테스트

```bash
pnpm --filter api test:e2e
# 내부적으로 nest build 후 dist 기반 스모크 테스트(run-smoke.js)를 실행합니다.
```
