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

payload=$(cat <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "CI (full) / secrets-scan-strict",
      "CI (full) / gitleaks",
      "Docs Validate / docs-validate"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true
}
JSON
)

echo "$payload" | gh api -X PUT \
  -H "Accept: application/vnd.github+json" \
  repos/$REPO/branches/main/protection \
  --input - >/dev/null

echo "Applied branch protection on $REPO main"
