---
file: basesettings.md
title: 금강부동산허브 - 관리자 베이스 설정 및 실행계획
owner: duksan
created: 2025-09-22 07:34 UTC / 2025-09-22 16:34 KST
updated: 2025-09-25 04:50 UTC / 2025-09-25 13:50 KST
status: in_progress
tags: [admin, baseline, plan, timeline, vector, postgres]
schemaVersion: 1
description: 관리자 페이지 구축을 위한 기준 문서. 실행 순서, 체크리스트, 완료 기준과 데이터/검색 설계를 포함.
code_refs:
  [
    'scripts/session_boot.sh',
    'scripts/validate_docs.sh',
    'scripts/checkpoint.sh',
    'scripts/edit_flow.js',
    'scripts/pr_create.sh',
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
    'apps/web/src/app/layout.tsx',
    'apps/web/src/lib/content.ts',
    'apps/web/src/app/api/documents/search/route.ts',
    'apps/web/src/app/admin/wiki/search-client.tsx',
    'apps/web/src/app/admin/wiki/editable-docs.ts',
    'apps/web/src/app/admin/wiki/actions.ts',
    'apps/web/src/app/admin/wiki/document-editor.tsx',
    'admin/docs/auth-rbac.md',
    'admin/docs/ui-graph-redesign.md',
    'admin/design/README.md',
    'apps/api/src/main.ts',
    'apps/api/src/app.module.ts',
    'apps/api/src/app.controller.ts',
    'apps/api/src/app.service.ts',
    'apps/api/src/metrics.service.ts',
    'apps/api/src/observability.ts',
    'apps/api/src/documents/documents.module.ts',
    'apps/api/src/documents/documents.controller.ts',
    'apps/api/src/documents/documents.service.ts',
    'apps/api/src/filters/sentry.filter.ts',
    'apps/api/test/run-smoke.js',
    'packages/documents/src/index.ts',
    'packages/documents/src/repository.ts',
    'packages/documents/src/search.ts',
    'packages/documents/src/list.ts',
    'packages/documents/src/types.ts',
    'apps/web/sentry.client.config.ts',
    'apps/web/sentry.config.ts',
    'apps/web/instrumentation.ts',
    'apps/web/next.config.ts',
    'apps/web/src/lib/status.server.ts',
    'apps/web/src/app/global-error.tsx',
  ]
---

# 개요

- 목적: 위키/옵시디언 스타일 관리자 페이지로 프로젝트 맥락·타임라인·의존관계·기술부채를 GUI/문서 동시 관리하고 GitHub로 버전/롤백을 보장.
- 목표: 주제만 바꾸면 재사용 가능한 강력한 베이스 시스템을 구축하고, 이후 부동산 도메인(질로우 벤치마크)로 확장.

# 범위(이번 사이클: 관리자 페이지 MVP)

- 문서 저장: 리포지토리 내 Markdown/JSON(YAML 프런트매터 메타 포함)
- 뷰어 UI: 위키/백링크, 간트/캘린더, 의존 그래프(로직트리/워크플로우)
- 상태 관리: 진행중/대기/보류/실패/설계변경중 배지 및 필터
- 검색: 하이브리드(키워드+벡터) 설계 반영, MVP는 문서 로딩/표시까지
- 거버넌스: 표준 주석 메타, 체크포인트 로그, Git 기준의 롤백

# 실행 순서(체크리스트 — 권장 수정안 반영)

- [x] M0-0 리포/도구 체계: 모노레포(Turborepo), pnpm, .nvmrc, .editorconfig, eslint/prettier, husky+lint-staged, .gitignore, .env.example, 브랜치 보호 규칙 (2025-09-22 15:21 UTC / 2025-09-23 00:21 KST — pnpm+turbo 초기화 및 개발 도구 설정 반영)
- [x] M0-1 문서 스캐폴딩: admin 구조/템플릿(문서/메타/체크포인트) 생성 (2025-09-22 18:45 UTC / 2025-09-23 03:45 KST — templates/\* 및 README 정리)
- [x] M0-2 표준 주석/프런트매터 규칙 확정 및 템플릿 배포 (2025-09-22 18:45 UTC / 2025-09-23 03:45 KST — doc/code/checkpoint 템플릿 업데이트 및 검증 지침 추가)
- [x] M0-3 CI 베이스: GitHub Actions(workflows)로 web/api lint/typecheck/build 설정 (2025-09-22 15:32 UTC / 2025-09-23 00:32 KST — build.yml 추가, pnpm lint/typecheck/build 파이프라인 연동)
- [x] M0-4 샘플 데이터: 간트(Mermaid), 의존 그래프(JSON), KPI 목업 추가 (2025-09-22 19:05 UTC / 2025-09-23 04:05 KST — admin/data/ 디렉터리 생성)
- [x] M1-0 프론트 부트스트랩: Next.js + Vercel Preview 설정 (2025-09-22 19:20 UTC / 2025-09-23 04:20 KST — Next.js 14 기반 앱 생성 및 기본 라우트 구성)
- [x] M1-1 관리자 UI(읽기 전용) 라우팅: /admin/dashboard | /admin/wiki | /admin/timeline | /admin/graph | /admin/tech-debt (2025-09-22 19:20 UTC / 2025-09-23 04:20 KST — App Router 라우팅 골격 완성)
- [x] M1-2 문서 로더/렌더러(Markdown+Frontmatter, 백링크 패널) 구현 (2025-09-22 19:22 UTC / 2025-09-23 04:22 KST — Markdown 로더 및 렌더러 연동)
- [x] M1-3 Timeline: Mermaid 간트·FullCalendar 월/주 뷰 표시 (2025-09-23 07:42 UTC / 2025-09-23 16:42 KST — Sprint 9 필터 UI 및 간트 렌더러 연동)
- [x] M1-4 Graph: React Flow 뷰어(읽기 전용) (2025-09-23 07:43 UTC / 2025-09-23 16:43 KST — React Flow 기반 그래프/범례 구축)
- [x] M1-5 API 스켈레톤(NestJS+Fastify): healthz/metrics, 공통 에러/로깅, CORS/레이트리밋, OpenAPI (2025-09-22 19:25 UTC / 2025-09-23 04:25 KST — NestJS Fastify 부팅 및 헬스/메트릭 엔드포인트 구현)
- [x] M1-6 관측 베이스: Sentry DSN/OTel 훅(토글 가능) (2025-09-22 19:25 UTC / 2025-09-23 04:25 KST — 환경 토글 기반 관측 후크 골조 추가)
- [x] M2-1 안전한 쓰기: 편집→브랜치→PR 생성(헤더 메타 자동 갱신)
- [x] M2-2 인증/RBAC 골격: Auth.js(이메일/SMS/소셜), Redis 세션/레이트리밋 (2025-09-25 05:55 UTC / 2025-09-25 14:55 KST — Auth.js 이메일 로그인, Redis 세션, 역할 가드 및 운영 런북 추가)
- [ ] M2-3 실시간(초기): Ably/Pusher 알림/채팅 목업 연결
- [ ] M2-4 하이브리드 검색 API 초안: 키워드 우선, 벡터 인터페이스 정의
- [ ] M2-5 그래프 뷰 리디자인: 전체 화면 그래프 레이아웃 및 보조 패널(범례/세부 정보) 집약 UI 설계·구현

## M2 상세 계획 (Sprint 2)

### M2-1 안전한 쓰기 플로우

- 목표: 문서를 수정하면 자동으로 작업 브랜치가 생성되고, `updated` 메타가 갱신된 PR을 쉽게 올릴 수 있게 한다.
- 주요 작업
  - `apps/web`에 편집 모드 토글과 저장 버튼 기본 UI 추가(편집 자체는 목업, 제출은 서버 액션).
  - `scripts/update_frontmatter_time.js`를 확장해 특정 파일 편집 시 즉시 updated를 갱신하도록 API/CLI 인터페이스 제공.
  - GitHub CLI 래퍼(`scripts/pr_create.sh`) 작성: 브랜치 생성 → 체크포인트 생성 → PR 템플릿 적용.
- 산출물/문서화: `admin/runbooks/editing.md` 초안, 체크포인트 자동 템플릿.
- 검증: 샘플 문서 편집 후 `pnpm run validate:docs`, `pnpm run validate:refs`, `pnpm --filter web lint`.

### M2-2 인증/RBAC 골격

- 목표: 최소한의 로그인/세션 구조와 역할 기반 권한 체계를 도입한다.
- 주요 작업
  - `Auth.js` + 이메일 Magic Link 기본 설정(`apps/web`, `apps/api` 연동).
  - Redis 세션 스토어/레이트리밋 래퍼(`packages/session`) 작성.
  - 역할 매핑(`admin/config/status.yaml` 참고)과 미들웨어로 권한 체크.
- 산출물: `.env.example` 환경 변수 확장, `admin/config/roles.yaml`, `admin/runbooks/auth.md`.
- 검증: `/admin` 경로 접속 시 세션/역할 헤더 확인, API `X-User-Role` 헤더 기반 가드 동작 수동 확인.

### M2-3 실시간 알림 목업

- 목표: Ably 또는 Pusher를 연결해 관리자 알림/채팅 목업을 구축한다.
- 주요 작업
  - 공급자 선정 후 `.env`/설정 파일 추가.
  - `apps/web`에 토스트/알림 패널 컴포넌트, `apps/api`에 이벤트 발행 API.
  - `packages/realtime` 유틸리티 작성(공급자 추상화).
- 산출물: `admin/docs/realtime.md`, 샘플 이벤트 데이터.
- 검증: 로컬에서 두 브라우저로 접속해 이벤트 브로드캐스트 확인, `pnpm run lint:web`/`pnpm run test`.

### M2-4 하이브리드 검색 API 확장

- 목표: 기존 키워드 검색에 벡터 인터페이스를 추가하고 API를 통합한다.
- 주요 작업
  - `packages/documents`에 임베딩 인터페이스(스텁) 추가 및 키워드+벡터 스코어링 구조 설계.
  - `apps/api/src/app.module.ts`에 검색 서비스 확장, `/api/documents/search`에서 쿼리 파라미터로 모드 선택 지원.
  - `apps/web/src/app/admin/wiki` 검색 바 UX 개선(필터/정렬).
- 산출물: `admin/docs/search.md`, 추가 샘플 데이터(`admin/data/search/*.json`).
- 검증: 단위 테스트(`packages/documents/src/__tests__`), API e2e 스모크, Lighthouse/Web Vitals 체크.

### M2-5 그래프 뷰 리디자인

- 목표: 1920×1080 기준 전체 화면을 활용한 그래프 뷰와 보조 패널(범례/노드 상세) 통합 UI를 제공한다.
- 주요 작업
  - 레이아웃 와이어프레임 작성 후 `apps/web/src/components/graph` 리팩토링: 그래프/패널 영역 비율, 전체 화면 토글, 패널 접기 기능.
  - 범례·엣지 설명을 탭/아코디언으로 재구성하고 반응형 대응.
  - 그래프 내 검색/줌 컨트롤 UX 개선(키보드 단축키 문서화 포함).
- 참고 문서: `admin/docs/ui-graph-redesign.md`
- 산출물: `admin/plan/ui-roadmap.md` 초안, 스토리북 또는 캡처 문서.
- 검증: 다양한 해상도(1440p/1080p)에서 수동 점검, `pnpm --filter web lint/build`.
- [ ] M3-1 DB 프로비저닝: Neon(Postgres+pgvector+PostGIS), Prisma 스키마/마이그/seed
- [ ] M3-2 임베딩 워커: BullMQ(청크/임베딩/색인) 및 하이브리드 검색 연결
- [ ] M3-3 그래프 편집 양방향: React Flow ↔ Mermaid/PNG, 캘린더 ICS 내보내기

# 완료 기준(관리자 페이지 MVP)

- [ ] 리포에 표준 메타 문서 구조(admin/\*) 존재, 체크포인트 자동/반자동 기록
- [ ] CI 베이스가 PR에서 lint/typecheck/build를 수행하고, 실패 시 머지 차단
- [ ] /admin/wiki 문서 렌더 + 백링크/태그/상태 배지 표시
- [ ] /admin/timeline 간트/캘린더에서 마일스톤/태스크 표시
- [ ] /admin/graph에서 의존 그래프 확인(읽기 전용)
- [ ] API 스켈레톤의 /healthz 200, /metrics 노출, OpenAPI 스펙 생성
- [x] Sentry/OTel가 베타 환경에서 에러/트레이스 수집(토글 가능) (2025-09-23 05:57 UTC / 2025-09-23 14:57 KST — Sentry DSN/프로파일링 및 OpenTelemetry NodeSDK 연동, Next.js Sentry 설정 추가)
- [ ] 상태 필터(진행중/대기/보류/실패/설계변경중) UI 동작
- [ ] “편집→브랜치→PR 생성” 플로우 정상, 문서 헤더 updated 자동 갱신
- [x] 키워드 검색 동작, 벡터 검색 인터페이스 정의(후속 연결 가능) (2025-09-23 03:40 UTC / 2025-09-23 12:40 KST — 문서 검색 패키지/Next.js·NestJS 검색 API 신설, 백링크/태그 검색 지원)
- [ ] README에 운영/개발/롤백 절차 문서화

# 데이터/검색 설계(베이스)

- DB: PostgreSQL
  - PostGIS: 지도·영역 쿼리(향후 매물/지오 기능 확장 대비)
  - pgvector(HNSW): 문서/태스크/부채/결정 임베딩 기반 KNN
- 하이브리드 검색: 키워드(tsvector/pg_trgm) + 벡터(cosine) 가중합 랭킹
- 임베딩 파이프라인: Markdown→청크(800~1500자, 10~15% 오버랩)→임베딩→pgvector upsert→지표 기록

# 서버/호스팅 맵(확정 제안)

- 프론트(Web): Vercel(Edge Functions/Middleware, 글로벌 캐시, 이미지 최적화)
- 백엔드(API/실시간): NestJS + Fastify, Fly.io(글로벌 근접 배치) — 초기에는 매니지드 실시간 사용
- 실시간: Ably 또는 Pusher(초기) → 트래픽 증가 시 자체 WebSocket 게이트웨이로 전환
- DB: Neon 서버리스 Postgres(+pgvector+PostGIS) — 필요 시 RDS로 이전
- 캐시/큐: Upstash Redis(Serverless)
- 스토리지: AWS S3(서명 URL) — 대체로 Cloudflare R2 가능
- 관측/모니터링: Sentry + OpenTelemetry(추적/로그/에러)
- 보안: Cloudflare(WAF/봇/레이트리밋), Auth.js + RBAC

# 프론트엔드 설계

- Next.js 14(App Router, RSC, Server Actions), TypeScript, Tailwind
- 렌더링 전략: SSG/ISR(문서), SSR/Streaming(개인화·검색), Edge Middleware(인증/리다이렉트)
- PWA: manifest.json, service worker, offline 캐시, 웹푸시, A2HS
- 반응형: Mobile-first, 컨테이너 쿼리, 스켈레톤/프로그레시브 데이터 페칭
- 컴포넌트: 디자인 토큰/테마, 상태 배지(진행중/대기/보류/실패/설계변경중)

# 백엔드 설계

- 프레임워크: NestJS + Fastify(고성능)
- API: REST 우선, GraphQL(선택) — OpenAPI 스펙 자동화
- 실시간: Gateway(WebSocket) 인터페이스(초기에는 Ably/Pusher 어댑터)
- 검증/보안: DTO/Zod, 레이트리밋, CORS, 입력 검증
- 큐/워커: BullMQ + Redis — 임베딩/색인/리포트/알림 배치
- 캐싱: Redis 키 전략(문서/그래프/검색 결과), SWR 헤더

# 성능 목표(초기)

- Edge TTFB ≤ 100ms, SSR Streaming TTFB ≤ 300ms
- LCP ≤ 2.5s(모바일 기준), API P95 ≤ 200ms(캐시 적중 시 ≤ 60ms)
- WebSocket 핸드셰이크 ≤ 200ms(근접 리전)

# AI/임베딩 파이프라인(상세)

1. 수집: admin/\* 변경 감지(Git 이벤트/주기 워커)
2. 파싱/청크: 800~1500자, 10~15% 오버랩, 섹션 메타 포함
3. 임베딩: Provider-agnostic(OpenAI/Anthropic/Groq/로컬) 인터페이스
4. 색인: pgvector upsert + HNSW 인덱스 유지
5. 질의: 하이브리드(키워드+KNN) → 재랭킹 → UI 표시

# PWA 체크리스트

- manifest, service worker, offline 캐시 전략, A2HS, 웹푸시
- 백그라운드 동기화, 네트워크 상태 처리, 아이콘/스플래시 세트

# 모노레포 구조(초안)

- apps/web(Next.js), apps/api(NestJS)
- packages/ui, packages/config(상태/역할/테마), packages/lib(공통)
- infra(후속: Terraform/IaC)

# 보안/거버넌스

- Auth.js(이메일/SMS/OAuth) + RBAC, 감사로그(AuditLog) 저장
- PR 기반 변경, main 보호 규칙, 체크포인트 문서 동시 기록

# 참고: 회의모드 규칙 신호

- 회의모드 해제 시그널: “실행하라”, “반영하라”
- 명시적 해제 신호 없으면 실행/쓰기 금지(제안·논의만)

# 파일 표준 주석(프런트매터 예시)

```yaml
---
file: admin/specs/search.md
title: 매물 검색 모듈 명세
owner: duksan
created: YYYY-MM-DD HH:MM UTC / YYYY-MM-DD HH:MM KST
updated: YYYY-MM-DD HH:MM UTC / YYYY-MM-DD HH:MM KST
status: in_progress
tags: [spec, search, listing]
schemaVersion: 1
description: 지도/필터/정렬/지오서치 요구사항 요약
---
```

# 핵심 모델(요약)

- Project, Milestone, Task, Decision, TechDebt, Doc, DocChunk, TimelineEvent, AuditLog
- Graph(JSON): nodes[{id,type,ref,status}], edges[{from,to,type}]

# UI/UX 요구사항(핵심)

- 위키: 트리/검색, 중앙 뷰, 우측 백링크·메타, [[링크]] 지원
- 타임라인: Mermaid 간트 + FullCalendar(월/주)
- 그래프: React Flow(노드/엣지 상태 컬러), 내보내기(Mermaid/PNG)
- 상태 배지: 진행중/대기/보류/실패/설계변경중
- AI 버튼: 대화 요약→할일/결정/리스크 초안 생성(목업→실연동)

# 설계 원칙(컴포넌트·단일책임·문서-코드 동기화)

- 컴포넌트화: 사용자 화면은 기능 단위 컴포넌트로 최대한 분리하여 디버깅 책임을 명확히 한다. 공통 UI는 `packages/ui`에, 도메인 전용 UI는 `apps/web` 하위 feature 폴더에 둔다.
- 단일 책임(1파일 1책임): 각 코드 파일은 하나의 책임만 가진다. 파일이 비대해질 경우 하위 모듈로 분리한다.
- 문서-코드 동기화: 문서와 코드가 서로를 참조한다.
  - 문서 프런트매터 예: `code_refs: ["apps/web/components/Timeline.tsx", "apps/api/src/modules/tasks/tasks.service.ts"]`
  - 코드 헤더 예: `doc_refs: ["admin/specs/timeline.md", "admin/plan/roadmap.md"]`
  - 리뷰 체크리스트에 상호 참조 여부를 포함한다(후속 pre-commit 훅으로 자동 검사 추가 예정).

# 거버넌스/체크포인트

- 모든 생성/수정/삭제는 admin/checkpoints/YYYYMMDD-HHMM-UTC_KST.md에 기록
- 주요 변경은 PR로 리뷰. main 보호 규칙 권장

# 리스크/선행과제(샘플)

- [ ] 벡터 임베딩 제공자 선정(클라우드 vs 로컬)
- [ ] Mermaid/React Flow 렌더 성능(큰 그래프) 튜닝 필요
- [ ] 권한/RBAC 모델 정의 및 적용 순서 합의

# KPI(예시)

- 문서 적용률(프런트매터 포함 비율) ≥ 95%
- UI 로딩 TTI ≤ 2.5s(문서 100개 기준)
- 검색 Top-10 적합률(휴리스틱 평가) ≥ 0.7

# 타임라인(초안)

- M0(스캐폴딩) → M1(읽기 전용 UI) → M2(편집/PR+AI) → M3(DB/벡터/워커)

# 롤백 절차(요약)

1. 문제 커밋 확인 → 2) git revert 또는 이전 태그/커밋 체크아웃 → 3) 체크포인트 문서로 영향 범위 확인 → 4) 복구 커밋/PR 생성

# 다음 단계 안내(실행 계획 링크)

- 본 설계도에 따라 실제 앱/서버/CI 골조를 올리기 위한 착수 계획은 `admin/plan/m1-kickoff.md` 문서를 새 채팅에서 트리거 문구로 실행하세요.
- 예) “실행하라: M0-0 리포/도구 체계 세팅”
