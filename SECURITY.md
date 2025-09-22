---
file: SECURITY.md
title: 보안 정책(초안)
owner: duksan
created: 2025-09-22 11:05 UTC / 2025-09-22 20:05 KST
updated: 2025-09-22 11:16 UTC / 2025-09-22 20:16 KST
status: active
tags: [security, policy]
schemaVersion: 1
description: 비밀정보 관리, 취약점 제보, 기본 보안 기준(헤더/CORS/레이트리밋) 요약 초안
---

# 비밀정보 관리
- 저장소에 비밀값(토큰/키/비밀번호)을 커밋하지 않습니다. 필요 시 `.env`와 시크릿 매니저를 사용합니다.
- 민감 키는 최소 권한·최소 기간 원칙을 따릅니다.

# 취약점 제보
- 이슈 템플릿의 Bug report 또는 별도 이메일 채널을 사용합니다.

# 기본 보안 기준(요약)
- 쿠키: Secure/HttpOnly/SameSite=Strict, `__Host-` 접두사
- CORS: 화이트리스트·자격증명 제어, 프리플라이트 제한
- 레이트리밋: IP/계정/라우트 단위
- 헤더: HSTS, CSP, Frame-Ancestors, Referrer-Policy, Permissions-Policy

# code_refs
- code_refs: ["scripts/secrets_scan.sh", ".gitleaks.toml", "apps/api/config/security.sample.json", ".github/workflows/ci.yml"]
