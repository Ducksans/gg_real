---
file: admin/runbooks/repo-protection.md
title: 메인 브랜치 보호 규칙 적용 가이드
owner: duksan
created: 2025-09-22 11:20 UTC / 2025-09-22 20:20 KST
updated: 2025-09-22 11:20 UTC / 2025-09-22 20:20 KST
status: active
tags: [runbook, governance, ci]
schemaVersion: 1
description: 모든 잡 통과시에만 머지/배포되도록 main 브랜치 보호 규칙을 적용하는 절차
---

# 요구사항
- 모든 PR은 다음 상태체크 통과 후에만 머지
  - CI (full) / secrets-scan-strict
  - CI (full) / gitleaks
  - Docs Validate / docs-validate

# GitHub UI로 설정
1. Settings → Branches → Branch protection rules → Add rule
2. Branch name pattern: `main`
3. Protect matching branches 체크
4. Require a pull request before merging 체크(Required approvals ≥ 1 권장)
5. Require status checks to pass before merging 체크 후 아래 체크박스에서 다음을 선택
   - `secrets-scan-strict`
   - `gitleaks`
   - `Docs Validate`
6. Include administrators(선택), Require conversation resolution(권장)
7. Create/Save 변경

# gh CLI로 설정(선택)
환경변수 준비: `GH_TOKEN`(repo admin 권한), `REPO` 예: `Ducksans/gg_real`
```bash
bash scripts/gh_protect_main.sh "$REPO"
```

# code_refs
- code_refs: [".github/workflows/ci.yml", ".github/workflows/docs-validate.yml", "scripts/gh_protect_main.sh"]
