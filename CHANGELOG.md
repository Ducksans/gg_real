---
file: CHANGELOG.md
title: 변경 로그
owner: duksan
created: 2025-09-22 14:22 UTC / 2025-09-22 23:22 KST
updated: 2025-09-23 06:36 UTC / 2025-09-23 15:36 KST
status: active
tags: [changelog, governance]
schemaVersion: 1
description: 스키마/거버넌스 관련 변경을 포함한 변경 로그
code_refs: ['scripts/validate_migrations.sh', 'admin/migrations/README.md']
---

# 가이드

- 스키마(문서/코드 메타의 schemaVersion) 변경 시, 해당 변경과 함께 이 파일을 업데이트합니다.
- 각 항목에는 날짜(UTC/KST), 관련 파일, 요약, 마이그레이션 파일명을 포함합니다.

# 2025-09-22

- 초기 도입(R10): 마이그레이션 거버넌스, 검증 스크립트, 템플릿 추가
  - scripts/validate_migrations.sh 추가
  - admin/migrations/README.md 및 templates 추가
  - docs-validate CI에 마이그 검증 추가 예정

# 2025-09-22 — Sprint 1 문서 기반 정리

- admin/templates/README.md 추가로 템플릿 사용 지침 문서화
- doc/frontmatter · checkpoint 템플릿 정비 및 reciprocal code_refs 보강
- basesettings.md의 M0-1, M0-2 완료 처리
- scripts/checkpoint.sh 메타 검증 유지 확인

# 2025-09-22 — Sprint 2 샘플 데이터 채우기

- admin/data/ 디렉터리에 timeline.gantt.md, graph.json, kpi.md 추가
- 샘플 데이터 README.md 작성 및 프런트매터 템플릿 링크 연동
- basesettings.md의 M0-4 항목 완료 표시

# 2025-09-22 — Sprint 3 프론트 골조 세우기

- apps/web Next.js 14 부트스트랩 및 관리자 라우트(/admin/\*) 스켈레톤 추가
- Markdown 로더(lib/content.ts)와 MarkdownContent 컴포넌트로 admin 문서/데이터 연결
- 배포용 README 갱신, lint 스크립트 검증

# 2025-09-22 — Sprint 4 API 골조 구축

- apps/api NestJS Fastify 스켈레톤 추가 (/healthz, /ready, /metrics 구현)
- 관측 토글 파일(observability.ts)과 metrics service 도입
- admin 문서(basesettings.md, m1-kickoff.md) 체크박스 업데이트, README 전환

# 2025-09-22 — Sprint 5 CI/거버넌스 강화

- build.yml에 web/api lint·build 매트릭스를 추가하고, lint:web/lint:api 스크립트 작성
- apps/api README를 프런트매터 포맷으로 정리하고 health.spec.ts를 통해 헬스 엔드포인트 호출 점검
- lint-staged 설정을 조정해 각 앱의 lint 명령이 프리커밋에서 자동 실행되도록 구성

# 2025-09-23 — Sprint 6 문서 검색 고도화

- `@gg-real/documents` 워크스페이스 라이브러리를 추가해 관리자 문서 메타 로딩 및 검색 로직을 공용화
- Next.js `/admin/wiki`에 검색 패널과 `/api/documents/search` 라우트를 도입해 실시간 키워드·태그 검색 및 백링크 표시 지원
- NestJS API에 `/documents/search` 엔드포인트와 문서 서비스 모듈을 추가해 UI·백엔드가 동일한 검색 엔진을 공유하도록 구성

# 2025-09-23 — Sprint 7 API 확장 및 테스트

- `/documents` 목록·필터 API와 `/documents/stats` 집계 API를 추가해 관리자 UI의 태그/상태 기반 탐색 토대를 마련
- `@gg-real/documents` 패키지에 문서 목록/통계 유틸리티를 추가(listDocuments, calculateDocumentStats)하고 `list.ts`를 신설해 책임 분리
- Next.js 콘텐츠 헬퍼에서 문서 요약·통계 함수를 노출해 향후 UI 연동을 준비하고, NestJS 문서 서비스가 신규 유틸리티를 활용하도록 리팩터링
- dist 기반 스모크 테스트(`pnpm --filter api test:e2e`)를 구성해 목록/검색/통계 로직을 자동으로 검증

# 2025-09-23 — Sprint 8 관측/알람 실연동

- NestJS `configureObservability`에 Sentry/OTel 초기화를 구현하고 콘솔 또는 OTLP Exporter로 스팬을 전송하도록 구성
- 전역 예외 필터(`SentryExceptionFilter`)로 서버 오류를 Sentry에 수집하고 종료 시 Sentry/OTel 리소스를 안전하게 정리
- Next.js 앱에 `@sentry/nextjs` 설정을 추가하고 클라이언트/서버/Edge 런타임에서 토글 기반 Sentry 초기화를 제공
- `.env.example`과 README들을 업데이트해 관측 관련 환경 변수와 사용법을 문서화
