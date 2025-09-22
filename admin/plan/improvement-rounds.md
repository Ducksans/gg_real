---
file: admin/plan/improvement-rounds.md
title: 개선 라운드 실행안(드리프트 방지/추적성/거버넌스/호환성/보안 강화)
owner: duksan
created: 2025-09-22 08:00 UTC / 2025-09-22 17:00 KST
updated: 2025-09-22 09:50 UTC / 2025-09-22 18:50 KST
status: in_progress
tags: [plan, improvement, governance]
schemaVersion: 1
description: 공백/취약점 개선을 라운드(1~11)로 묶어 실행·수용기준·삭제 프로토콜을 정의
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
  - [ ] 문서 변경 포함 커밋 시 체크포인트가 자동 생성

# Round 6 — PR/리뷰 표준화
- [x] .github/pull_request_template.md, .github/ISSUE_TEMPLATE/*
- 수용기준
  - [x] 회의모드 해제·동기화 승인·code_refs/doc_refs·체크포인트 항목 확인

# Round 7 — 보안/비밀정보 게이트
- [ ] SECURITY.md, THREAT_MODEL.md(STRIDE) 초안
- [ ] .gitleaks.toml, scripts/secrets_scan.sh, .env.example
- [ ] 보안 헤더/CORS/레이트리밋 기본값 문서화 및 샘플 설정 파일
- [ ] 업로드 안티바이러스 큐(설계 문서)·EXIF 제거 플로 문서화
- 수용기준
  - [ ] secrets_scan CI 통과 필수, 민감정보 커밋 차단
  - [ ] 보안 헤더/CORS/레이트리밋 기본값이 레포에 존재하고 샘플 서버에서 검증됨
  - [ ] 관리자 경로 MFA/SSO 요구사항 문서화 완료

# Round 8 — CI 파이프라인(확장)
- [ ] .github/workflows/ci.yml(install/lint/typecheck/build/docs-validate/secrets-scan/a11y/e2e/SCA/SAST)
- 수용기준
  - [ ] main 보호: 모든 잡 통과 시에만 머지/배포

# 부록 — 체크리스트 리소스 링크(추가 예정)
- support-matrix 정의 파일: admin/config/support-matrix.yaml
- 보안 정책 요약: SECURITY.md, THREAT_MODEL.md
- 샘플 헤더/CORS/레이트리밋 설정: apps/api/config/security.sample.json

# Round 9 — 문서↔코드 상호 참조 강제
- [ ] validate_refs 강화(경로 존재/패턴 검사), dead link 리포트
- 수용기준
  - [ ] 문서 code_refs↔코드 doc_refs 쌍방 매칭 100%

# Round 10 — 스키마 버전·마이그레이션 거버넌스
- [ ] CHANGELOG.md, admin/migrations/README.md, 마이그 스크립트 템플릿
- 수용기준
  - [ ] schemaVersion 변경 시 변경 로그·마이그 파일 필수

# Round 11 — 운영 런북/롤백 절차
- [ ] admin/runbooks/release.md, rollback.md
- 수용기준
  - [ ] 릴리즈 태깅·주간 스냅샷·롤백 절차 문서화 및 검증
