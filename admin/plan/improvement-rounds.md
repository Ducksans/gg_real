---
file: admin/plan/improvement-rounds.md
title: 개선 라운드 실행안(드리프트 방지/추적성/거버넌스/호환성/보안 강화)
owner: duksan
created: 2025-09-22 08:00 UTC / 2025-09-22 17:00 KST
updated: 2025-09-22 16:47 UTC / 2025-09-23 01:47 KST
status: in_progress
tags: [plan, improvement, governance]
schemaVersion: 1
description: 공백/취약점 개선을 라운드(1~11)로 묶어 실행·수용기준·삭제 프로토콜을 정의
code_refs:
  [
    'scripts/validate_refs.sh',
    'scripts/checkpoint.sh',
    'scripts/secrets_scan.sh',
    'scripts/validate_migrations.sh',
    'scripts/validate_sidecar_meta.sh',
    'scripts/update_frontmatter_time.sh',
    'scripts/gh_protect_main.sh',
  ]
---

# 목적

- 문서/코드 드리프트 방지, 리부트 내구성 강화, 추적성·거버넌스·보안 자동화를 달성한다.

# 삭제 프로토콜(최종)

1. 모든 라운드의 수용기준을 100% 충족한다.
2. 최신 체크포인트에 완료 보고를 남긴다.
3. 스냅샷 태그(예: `improve-rounds-done-YYYYMMDD`)를 생성한다.
4. 사용자로부터 “삭제 승인”을 받은 후 PR로 본 문서를 제거한다.

# 라운드 개요

- Round 1: Single Source of Truth(SoT) 도입
- Round 2: 결정 로그 중앙화
- Round 3: 품질 게이트(Pre-commit/CI 1차)
- Round 4: 세션 부팅/모드 영속화
- Round 5: 체크포인트 자동화
- Round 6: PR/리뷰 표준화
- Round 7: 보안/비밀정보 게이트(최고 수준 보안 베이스)
- Round 8: CI 파이프라인(확장: SCA/SAST/DAST/a11y/e2e)
- Round 9: 문서↔코드 상호 참조 강제
- Round 10: 스키마 버전·마이그레이션 거버넌스
- Round 11: 운영 런북/롤백 절차

# 기준선(최고 수준 호환성/보안/개발환경)

## 호환성 기준(브라우저/OS/디바이스)

- 브라우저: Chrome/Edge/Firefox 최신 2버전, Safari(iOS/iPadOS) 최신 2버전
- OS: iOS 16.4+, Android 10+, Windows 10+/11, macOS 12+, 주요 리눅스 LTS
- PWA: iOS 푸시(iOS 16.4+), 오프라인/백그라운드 동기화는 기능 감지 후 폴백 제공
- 디바이스: 모바일(≥360×640), 태블릿, 데스크톱 반응형. 컨테이너 쿼리와 스켈레톤 로딩 채택
- 접근성: WCAG 2.1 AA 목표, 키보드 내비·명암비·스크린리더 지원, 다국어 로케일 분리

## 보안 기준(핵심 통제)

- 인증/세션: MFA(WebAuthn/OTP), 관리자 SSO+IP 제한, 세션 고정 방지, 로그인 알림·세션 관리
- 쿠키/토큰: Secure/HttpOnly/SameSite=Strict, `__Host-` 접두사, 토큰 회전, 짧은 수명
- 권한: 서버측 RBAC 강제, 리소스 소유권 확인, 테넌트 경계(필요 시 RLS)
- 데이터 입력/렌더: XSS 방어(sanitize), 파일 업로드 MIME/매직넘버 검사·크기 제한·EXIF 제거, S3 서명 URL 최소권한·만료
- API/네트워크: CORS 화이트리스트, CSRF 보호(쿠키 모드), 레이트리밋(IP/계정/라우트), 요청 크기 제한, 재시도 폭주 방지
- 보안 헤더: HSTS(preload), CSP(strict-dynamic/nonce), Frame-Ancestors, Referrer-Policy, Permissions-Policy
- 데이터 보호: TLS 강제, 저장 암호화(관리형 DB/S3), 키 로테이션, 백업/삭제 정책, 로그 PII 마스킹
- AI/임베딩: 민감 데이터 비색인/레드액션, 서드파티 호출 시 데이터 정책·옵트아웃
- 운영: WAF/CDN 보호, SCA/SAST/DAST(gitleaks/Dependabot/CodeQL), 서명 커밋·필수 리뷰·브랜치 보호

## 최신 개발 환경 기준

- Node LTS 고정(.nvmrc), pnpm, Turborepo 모노레포
- Devcontainer/Docker(선택)로 OS 간 일관성, cross-platform 스크립트 사용
- GitHub Actions 기반 CI: install/lint/typecheck/build/test/docs-validate/secrets-scan/a11y/e2e
- 모니터링: OpenTelemetry 트레이싱 + Sentry 에러, 성능지표(LCP/TTFB) 수집

# Round 1 — SoT 도입

- [x] admin/state/project.json 생성(프로젝트·마일스톤·태스크·의존성)
- [x] admin/config/status.yaml 생성(상태 enum·색상/아이콘)
- [x] admin/config/taxonomy.yaml 생성(태그 규약)
- 수용기준
  - [x] 모든 체크리스트 항목이 SoT에 반영되고, 상태값이 enum과 일치함
  - [x] 각 항목은 안정적 id/slug를 가진다
- 완료시각: 2025-09-22 08:00 UTC / 2025-09-22 17:00 KST

# Round 2 — 결정 로그 중앙화

- [x] admin/decisions/index.md 템플릿 및 폴더 구조 생성
- 수용기준
  - [x] 중대한 결정이 decisions/에 카드화되고 체크포인트·PR과 상호 링크됨
  - [x] SoT의 decisions 동기화 계획 명시(필드 예약)

# Round 3 — 품질 게이트(Pre-commit/CI 1차)

- [x] scripts/validate_docs.sh, scripts/validate_refs.sh 초안
- [x] 프런트매터 필수키, code_refs/doc_refs, 상태 enum, UTC/KST 포맷 검사(기본 루틴)
- [x] 호환성 매트릭스 존재 여부 및 필수 필드 검사(support-matrix)
- 수용기준
  - [x] 로컬 검증 스크립트로 기본 오류 감지, CI 연동 계획 수립

# Round 4 — 세션 부팅/모드 영속화

- [x] scripts/session_boot.sh, admin/state/session.json
- 수용기준
  - [x] 리부트 시 AGENTS→basesettings→checkpoints→SoT→decisions 순서로 요약 출력(MVP)
  - [x] session.json에 모드/라운드/타임스탬프 기록

# Round 5 — 체크포인트 자동화

- [x] scripts/checkpoint.sh(변경 파일 자동 수집→체크포인트 생성)
- 수용기준
  - [x] 문서 변경 포함 커밋 시 체크포인트가 자동 생성

# Round 6 — PR/리뷰 표준화

- [x] .github/pull_request_template.md, .github/ISSUE_TEMPLATE/\*
- 수용기준
  - [x] 회의모드 해제·동기화 승인·code_refs/doc_refs·체크포인트 항목 확인

# Round 7 — 보안/비밀정보 게이트

- [x] SECURITY.md, THREAT_MODEL.md(STRIDE) 초안
- [x] .gitleaks.toml, scripts/secrets_scan.sh, .env.example
- [x] 보안 헤더/CORS/레이트리밋 기본값 문서화 및 샘플 설정 파일
- [x] 업로드 안티바이러스 큐(설계 문서)·EXIF 제거 플로 문서화
- 수용기준
  - [x] secrets_scan CI 통과 필수, 민감정보 커밋 차단
  - [x] 보안 헤더/CORS/레이트리밋 기본값이 레포에 존재하고 샘플 서버에서 검증됨
  - [x] 관리자 경로 MFA/SSO 요구사항 문서화 완료

# Round 8 — CI 파이프라인(확장)

- [x] .github/workflows/ci.yml(secrets-scan strict, gitleaks)
- [x] admin/runbooks/repo-protection.md(메인 보호 규칙 적용 가이드)
- 수용기준
  - [x] main 보호: 모든 잡 통과 시에만 머지/배포(적용 가이드+gh 스크립트 제공)

# 부록 — 체크리스트 리소스 링크(추가 예정)

- support-matrix 정의 파일: admin/config/support-matrix.yaml
- 보안 정책 요약: SECURITY.md, THREAT_MODEL.md
- 샘플 헤더/CORS/레이트리밋 설정: apps/api/config/security.sample.json

# Round 9 — 문서↔코드 상호 참조 강제

- [x] validate_refs 강화(경로 존재/패턴 검사), dead link 리포트
- 수용기준
  - [x] 문서 code_refs↔코드 doc_refs 쌍방 매칭 100%

완료시각: 2025-09-22 14:19 UTC / 2025-09-22 23:19 KST

# Round 10 — 스키마 버전·마이그레이션 거버넌스

- [x] CHANGELOG.md, admin/migrations/README.md, 마이그 스크립트 템플릿
- 수용기준
  - [x] schemaVersion 변경 시 변경 로그·마이그 파일 필수

완료시각: 2025-09-22 14:29 UTC / 2025-09-22 23:29 KST

# 보완 계획(P1~P3)

## [P1] 즉시 강화 항목

- 프리커밋에서 핵심 검사 실행: validate_docs / validate_refs / validate_migrations / validate_code_headers / validate_sidecar_meta
- 결정 로그 카드 채우기: admin/decisions/index.md에 최근 결정(자동 후속 실행 정책, .env 차단, R9/R10/R11 도입) 기록
- schemaVersion 감시 확장: JSON/YAML도 포함(admin/state/_.json, admin/config/_.yaml)

## [P2] 자동화·강제화

- 주간 스냅샷 태그를 GitHub Actions로 자동화
- R9 강도 상향: scripts/*, apps/*에는 doc_refs 의무화(템플릿 제외)
- 문서 updated 자동 스탬프: 프리커밋 훅으로 UTC/KST 동기화(재발 방지 대책)

## [P3] 앱 골조·운영 편의

- M1-0/1/2: Next.js 스캐폴딩, 관리자 읽기 전용 라우팅, 문서 로더
- M1-5/6: API 스켈레톤(healthz/metrics) + 관측(Sentry/OTel)
- 마이그 새 문서/스크립트 생성기(scripts/migration_new.sh)

# Round 11 — 운영 런북/롤백 절차

- [x] admin/runbooks/release.md, rollback.md
- 수용기준
  - [x] 릴리즈 태깅·주간 스냅샷·롤백 절차 문서화 및 검증

완료시각: 2025-09-22 14:29 UTC / 2025-09-22 23:29 KST

# 부록 — 프런트매터 고도화 긴급 패치 SoT

## 패치 목표

- 문서↔코드 상호참조 100% 달성 및 데드링크 제거
- 프런트매터 스키마/타임스탬프 자동화로 타임라인 신뢰도 확보
- 로컬·CI 품질 게이트 일치로 회귀 사고 방지

## 작업 단계

### Phase 0 — 준비

1. 루트 `package.json`에 ajv/ajv-cli/ajv-formats/js-yaml/yaml을 devDependencies로 추가한다.
2. `pnpm install`로 의존성을 설치하고 `node_modules` 캐시 상태를 확인한다.
3. 작업 착수 전 최신 `chore/branch-protection-warmup` 브랜치를 기준으로 체크포인트를 남긴다.

- 진행 상황
  - [완료] 2025-09-22 16:43 UTC / 2025-09-23 01:43 KST — devDependencies 추가 및 pnpm install, 체크포인트 2건 생성(20250922-1635, 20250922-1641)

### Phase 1 — 검증 스크립트 고도화

1. `scripts/validate_refs.sh`를 Node+yaml 기반 양방향 검증 스크립트로 재작성한다.
2. `scripts/validate_docs.sh`에 ajv 스키마 검증, created≤updated 확인, frontmatter.file 경로 일치 검증을 추가한다.
3. `admin/schemas/frontmatter.schema.json`을 작성하고 스키마 버전을 문서화한다.

### Phase 2 — 타임스탬프 자동화

1. `scripts/update_frontmatter_time.sh`를 작성하여 스테이징된 Markdown의 updated를 UTC/KST 동시 갱신한다.
2. `package.json`에 `precommit:meta` 스크립트를 추가하고 `pnpm exec` 기반으로 구성한다.
3. `.husky/pre-commit`에서 `pnpm -s precommit:meta`를 호출하도록 갱신 후 실행 권한을 설정한다.

### Phase 3 — CI 동기화

1. `.github/workflows/docs-validate.yml`에서 Node 20 + pnpm 셋업을 명시하고 devDependencies를 사용한다.
2. 워크플로에서 `pnpm run validate:docs`와 `pnpm run validate:refs`를 호출하여 로컬과 동일한 검증을 수행한다.
3. AJV 설치를 devDependencies 기반으로 수행하고 중복 전역 설치를 제거한다.

### Phase 4 — 체크포인트 강화 및 회귀 테스트

1. `scripts/checkpoint.sh`에 필수 메타 누락 검사 로직을 추가한다.
2. `pnpm run validate:docs`와 `pnpm run validate:refs`를 실행하여 회귀 테스트를 통과시킨다.
3. 빌드 파이프라인이 통과한 PR을 생성하고 main 병합 후 체크포인트 기록을 갱신한다.

## 인수 기준

- 문서/코드 양방향 참조 검증이 로컬과 CI 모두에서 실패 없이 통과한다.
- 프런트매터 스키마 검증과 updated 자동 갱신이 pre-commit 단계에서 정상 작동한다.
- Build Pipeline, Docs Validate 워크플로가 추가 규칙을 포함한 상태로 연속 두 차례 성공한다.
