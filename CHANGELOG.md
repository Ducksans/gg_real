---
file: CHANGELOG.md
title: 변경 로그
owner: duksan
created: 2025-09-22 14:22 UTC / 2025-09-22 23:22 KST
updated: 2025-09-22 20:50 UTC / 2025-09-23 05:50 KST
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
