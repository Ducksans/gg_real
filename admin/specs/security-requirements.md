---
file: admin/specs/security-requirements.md
title: 관리자 경로 보안 요구사항(MFA/SSO/RBAC)
owner: duksan
created: 2025-09-22 11:16 UTC / 2025-09-22 20:16 KST
updated: 2025-09-22 11:16 UTC / 2025-09-22 20:16 KST
status: active
tags: [security, requirements]
schemaVersion: 1
description: 관리자 경로 보호를 위한 인증·인가 요구사항 정의(MFA/SSO/RBAC/세션 정책)
---

# 요구사항
- 인증: SSO(기업) 또는 Auth.js 기반 로그인 + MFA(WebAuthn/OTP) 필수
- 세션: Secure/HttpOnly/SameSite=Strict, 세션 고정 방지, 동시 세션 제한, 로그인 알림
- 인가: RBAC(관리자/에디터/뷰어), 리소스 소유권 검증, 테넌트 경계 고려
- 감사: 관리자 경로 접근/설정 변경 감사 로그, 실패 이벤트 경보

# 수용기준
- 관리자 경로 접근은 MFA를 요구하고, 실패 시 지연/락 정책 적용
- RBAC 정책이 문서화되어 있으며, 최소 권한 원칙 준수
- 보안 설정 변경은 2인 승인 원칙과 감사 로그에 기록

# code_refs
- code_refs: ["SECURITY.md", "THREAT_MODEL.md", "apps/api/config/security.sample.json"]
