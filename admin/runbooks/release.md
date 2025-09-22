---
file: admin/runbooks/release.md
title: 운영 런북 — 릴리즈/스냅샷 태깅 절차(R11)
owner: duksan
created: 2025-09-22 14:28 UTC / 2025-09-22 23:28 KST
updated: 2025-09-22 14:28 UTC / 2025-09-22 23:28 KST
status: active
tags: [runbook, release]
schemaVersion: 1
description: 릴리즈 태그/주간 스냅샷/체크포인트·검증 절차
code_refs: [".github/workflows/docs-validate.yml", "scripts/validate_docs.sh", "scripts/validate_refs.sh", "scripts/validate_migrations.sh"]
---

# 목적
- 안정적으로 배포할 수 있도록 태깅과 검증 순서를 표준화합니다.

# 릴리즈 순서(태깅)
1. 로컬 검증: `bash scripts/validate_docs.sh && bash scripts/validate_refs.sh && bash scripts/validate_migrations.sh`
2. main 최신 반영 후 CI 통과 확인
3. 태깅: `git tag -a vX.Y.Z -m "release: vX.Y.Z" && git push origin vX.Y.Z`
4. 체크포인트 자동 생성 확인(admin/checkpoints/*)

# 주간 스냅샷 태그
- 네이밍: `snapshot-YYYYMMDD`
- 생성: `git tag -a snapshot-$(date -u +%Y%m%d) -m "weekly snapshot" && git push origin snapshot-$(date -u +%Y%m%d)`

# 롤백 힌트
- 태그/커밋 기준으로 체크아웃: `git checkout <tag-or-commit>` 후 검증
- 자세한 절차는 rollback.md 참조

