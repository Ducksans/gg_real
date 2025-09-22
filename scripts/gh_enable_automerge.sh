#!/usr/bin/env bash
# file: scripts/gh_enable_automerge.sh
# owner: duksan
# created: 2025-09-22 13:45 UTC / 2025-09-22 22:45 KST
# updated: 2025-09-22 17:23 UTC / 2025-09-23 02:23 KST
# purpose: 레포에 Auto-merge 및 머지 기본설정 활성화(관리자 권한 필요)
# usage: GH_TOKEN=... bash scripts/gh_enable_automerge.sh Ducksans/gg_real
# doc_refs: ["AGENTS.md", "admin/runbooks/repo-protection.md", "admin/plan/improvement-rounds.md"]
set -euo pipefail

set -euo pipefail

REPO=${1:?"usage: $0 <owner/repo>"}

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI 필요: https://cli.github.com" >&2; exit 2
fi

echo "[1/2] Enable repository auto-merge + delete-branch-on-merge"
gh repo edit "$REPO" --enable-auto-merge --delete-branch-on-merge >/dev/null

echo "[2/2] Ensure squash merge is allowed (and keep others enabled)"
gh api -X PATCH \
  -H "Accept: application/vnd.github+json" \
  repos/$REPO \
  -f allow_squash_merge=true >/dev/null

echo "Done: Auto-merge enabled for $REPO"
