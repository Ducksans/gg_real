---
file: THREAT_MODEL.md
title: 위협 모델(STRIDE) 초안
owner: duksan
created: 2025-09-22 11:06 UTC / 2025-09-22 20:06 KST
updated: 2025-09-22 11:16 UTC / 2025-09-22 20:16 KST
status: active
tags: [security, threat-model]
schemaVersion: 1
description: STRIDE 관점의 핵심 위험과 통제 초안
code_refs: ["scripts/secrets_scan.sh"]
---

# 범위
- 관리자 웹(UI)와 서버(API), 문서/자동화 스크립트

# STRIDE 요약과 기본 통제
- Spoofing: MFA/SSO, 세션 고정 방지, 서명 쿠키
- Tampering: 서명 커밋, 보호 브랜치, 무결성 체크
- Repudiation: 감사 로그, 불변 로그 저장
- Information Disclosure: 시크릿 스캔, PII 마스킹, 최소 권한
- Denial of Service: 레이트리밋, 요청 크기 제한, 재시도 폭주 방지
- Elevation of Privilege: RBAC, 관리자 경로 보호, 코드 리뷰 필수

