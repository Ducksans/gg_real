#!/usr/bin/env bash
# file: scripts/gh_protect_main.sh
# purpose: gh CLI로 main 브랜치 보호 규칙 적용
# usage: GH_TOKEN=... bash scripts/gh_protect_main.sh Ducksans/gg_real
set -euo pipefail

REPO=${1:?"usage: $0 <owner/repo>"}
export GH_TOKEN=${GH_TOKEN:-}
if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI가 필요합니다: https://cli.github.com/" >&2
  exit 2
fi

# Require PRs and specific checks
gh api -X PUT repos/$REPO/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  -f required_status_checks.strict=true \
  -f required_status_checks.contexts[]='secrets-scan-strict' \
  -f required_status_checks.contexts[]='gitleaks' \
  -f enforce_admins=true \
  -F required_pull_request_reviews.required_approving_review_count=1 \
  -F required_pull_request_reviews.dismiss_stale_reviews=true \
  -F restrictions=null \
  -F allow_deletions=false \
  -F required_linear_history=true \
  -F allow_force_pushes=false \
  -F block_creations=false \
  -F required_conversation_resolution=true \
  >/dev/null

echo "Applied branch protection on $REPO main"
