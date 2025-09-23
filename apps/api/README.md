---
file: apps/api/README.md
title: apps/api 개발 안내
owner: duksan
created: 2025-09-22 19:25 UTC / 2025-09-23 04:25 KST
updated: 2025-09-23 02:57 UTC / 2025-09-23 11:57 KST
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

## 관측 토글

`scripts/observability.ts`는 Sentry(`ENABLE_SENTRY=true`)와 OpenTelemetry(`ENABLE_OTEL=true`)를 플래그 기반으로 초기화할 수 있도록 자리잡아두었습니다. 실제 초기화 코드는 후속 스프린트에서 추가합니다.

## 폴더 구조

- `src/` — NestJS 애플리케이션 코드
  - `main.ts` 부트스트랩, `app.controller.ts` 엔드포인트, `metrics.service.ts` 메트릭 수집
  - `observability.ts` 관측 초기화 토글
- `test/` 및 e2e 스펙은 향후 필요 시 추가합니다.

## TODO

- Prometheus 포맷 메트릭 변환
- Sentry/OTel 실제 초기화 코드 추가
- API e2e 테스트(Postman 컬렉션 또는 Pact) 구성
