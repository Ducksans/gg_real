---
file: basesettings.md
title: 금강부동산허브 - 관리자 베이스 설정 및 실행계획
owner: duksan
created: 2025-09-22 07:34 UTC / 2025-09-22 16:34 KST
updated: 2025-09-22 07:45 UTC / 2025-09-22 16:45 KST
status: in_progress
tags: [admin, baseline, plan, timeline, vector, postgres]
schemaVersion: 1
description: 관리자 페이지 구축을 위한 기준 문서. 실행 순서, 체크리스트, 완료 기준과 데이터/검색 설계를 포함.
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

# 실행 순서(체크리스트)
- [ ] M0-1 스캐폴딩: admin 구조/템플릿(문서/메타/체크포인트) 생성
- [ ] M0-2 표준 주석/프런트매터 규칙 확정 및 템플릿 배포
- [ ] M0-3 샘플 타임라인(간트)·의존 그래프(React Flow JSON/Mermaid) 데이터 추가
- [ ] M1-1 관리자 UI(읽기 전용) 라우팅: /admin/dashboard | /admin/wiki | /admin/timeline | /admin/graph | /admin/tech-debt
- [ ] M1-2 문서 로더/렌더러(Markdown+Frontmatter, 백링크 패널) 구현
- [ ] M1-3 Mermaid 간트·FullCalendar 월/주 뷰 표시
- [ ] M1-4 그래프 뷰어(React Flow) 읽기 전용
- [ ] M2-1 안전한 쓰기: 편집→브랜치→PR 생성(헤더 메타 자동 갱신)
- [ ] M2-2 AI 액션(대화 요약→할일/결정/리스크 초안) 버튼 목업→API 연결
- [ ] M2-3 하이브리드 검색 API 초안(키워드 우선, 벡터 인터페이스만 정의)
- [ ] M3-1 DB 스키마 초안(Postgres+pgvector+PostGIS) 및 마이그레이션 스크립트
- [ ] M3-2 문서 임베딩 파이프라인(청크/임베딩/색인) 워커 설계 및 목업
- [ ] M3-3 그래프 편집/내보내기(React Flow→Mermaid/PNG) & 캘린더 ICS 내보내기

# 완료 기준(관리자 페이지 MVP)
- [ ] 리포지토리에 표준 메타가 있는 문서 구조(admin/*)가 존재하고 체크포인트가 자동/반자동으로 추가된다.
- [ ] /admin/wiki에서 문서 렌더, 백링크/태그/상태 배지가 표시된다.
- [ ] /admin/timeline에서 간트와 캘린더로 마일스톤/태스크가 보인다.
- [ ] /admin/graph에서 의존관계 그래프를 시각적으로 확인할 수 있다(읽기 전용).
- [ ] 상태 필터(진행중/대기/보류/실패/설계변경중)가 UI에서 동작한다.
- [ ] “편집→브랜치→PR 생성” 플로우가 동작하고 문서 헤더의 updated가 자동 갱신된다.
- [ ] 검색 창에 키워드 기반 검색이 가능하며, 벡터 검색을 위한 인터페이스가 정의되어 있다.
- [ ] README에 운영/개발 방법과 롤백 절차가 문서화되어 있다.

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
1) 수집: admin/* 변경 감지(Git 이벤트/주기 워커)
2) 파싱/청크: 800~1500자, 10~15% 오버랩, 섹션 메타 포함
3) 임베딩: Provider-agnostic(OpenAI/Anthropic/Groq/로컬) 인터페이스
4) 색인: pgvector upsert + HNSW 인덱스 유지
5) 질의: 하이브리드(키워드+KNN) → 재랭킹 → UI 표시

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
1) 문제 커밋 확인 → 2) git revert 또는 이전 태그/커밋 체크아웃 → 3) 체크포인트 문서로 영향 범위 확인 → 4) 복구 커밋/PR 생성
