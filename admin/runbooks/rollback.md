---
file: admin/runbooks/rollback.md
title: 운영 런북 — 롤백 절차(R11)
owner: duksan
created: 2025-09-22 14:28 UTC / 2025-09-22 23:28 KST
updated: 2025-09-22 14:28 UTC / 2025-09-22 23:28 KST
status: active
tags: [runbook, rollback]
schemaVersion: 1
description: 배포 문제 발생 시 안전한 롤백 절차
code_refs: ["admin/checkpoints/20250922-1426-UTC_2326-KST.md", "CHANGELOG.md", "scripts/validate_docs.sh"]
---

# 전제
- 모든 변경은 체크포인트와 태그를 남김

# 절차(요약)
1. 문제 커밋/태그 확인: CHANGELOG와 체크포인트로 영향 범위 파악
2. 롤백 방식 선택
   - (안전) `git revert <bad-commit>`로 되돌림 커밋 생성
   - (긴급) 태그/이전 커밋으로 배포 재지정 후 원인 분석
3. 검증: 문서/참조/마이그 검증 스크립트 실행
   - `bash scripts/validate_docs.sh && bash scripts/validate_refs.sh && bash scripts/validate_migrations.sh`
4. 후속: 원인 분석 보고 및 재발 방지 조치
