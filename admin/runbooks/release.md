---
file: admin/runbooks/release.md
title: 운영 런북 — 릴리즈/스냅샷 태깅 절차(R11)
owner: duksan
created: 2025-09-22 14:28 UTC / 2025-09-22 23:28 KST
updated: 2025-09-22 17:53 UTC / 2025-09-23 02:53 KST
status: active
tags: [runbook, release]
schemaVersion: 1
description: 릴리즈 태그/주간 스냅샷/체크포인트·검증 절차
code_refs:
  [
    '.github/workflows/docs-validate.yml',
    'scripts/validate_docs.sh',
    'scripts/validate_refs.sh',
    'scripts/validate_migrations.sh',
    'scripts/update_frontmatter_time.js',
    'scripts/update_frontmatter_time.sh',
  ]
---

# 목적

- 안정적으로 배포할 수 있도록 태깅과 검증 순서를 표준화합니다.

# 릴리즈 순서(태깅)

1. 로컬 검증: `bash scripts/validate_docs.sh && bash scripts/validate_refs.sh && bash scripts/validate_migrations.sh`
2. main 최신 반영 후 CI 통과 확인
3. 태깅: `git tag -a vX.Y.Z -m "release: vX.Y.Z" && git push origin vX.Y.Z`
4. 체크포인트 자동 생성 확인(admin/checkpoints/\*)

# 주간 스냅샷 태그

- 네이밍: `snapshot-YYYYMMDD`
- 생성: `git tag -a snapshot-$(date -u +%Y%m%d) -m "weekly snapshot" && git push origin snapshot-$(date -u +%Y%m%d)`

# 롤백 힌트

- 태그/커밋 기준으로 체크아웃: `git checkout <tag-or-commit>` 후 검증
- 자세한 절차는 rollback.md 참조

# 프런트매터 타임스탬프 자동화

- pre-commit 단계에서 `pnpm -s precommit:meta`가 실행되며, `scripts/update_frontmatter_time.js --staged`가 스테이징된 Markdown의 `updated` 값을 UTC/KST로 갱신한 뒤 `pnpm run validate:refs`를 호출합니다.
- 수동 실행이 필요한 경우 `pnpm exec node scripts/update_frontmatter_time.js <files...>` 또는 호환용 래퍼 `bash scripts/update_frontmatter_time.sh --staged`를 사용할 수 있습니다.
- 타임스탬프는 분 단위(UTC, KST 동시에)로 기록되며, 스크립트는 `updated:` 키가 Frontmatter에 존재하는 파일만 변경합니다.
