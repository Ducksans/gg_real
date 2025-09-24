#!/usr/bin/env bash
# file: scripts/pr_create.sh
# owner: duksan
# created: 2025-09-24 08:25 UTC / 2025-09-24 17:25 KST
# updated: 2025-09-24 08:25 UTC / 2025-09-24 17:25 KST
# purpose: 현재 브랜치 상태를 기반으로 PR을 자동 생성(푸시 포함)
# doc_refs: ["admin/runbooks/editing.md", "basesettings.md", "scripts/edit_flow.js"]
set -euo pipefail

BASE_BRANCH="main"
PR_TITLE=""
PR_BODY=""
BODY_FILE=""
DRAFT=false
PUSH=true

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      BASE_BRANCH="$2"
      shift 2
      ;;
    --title)
      PR_TITLE="$2"
      shift 2
      ;;
    --body)
      PR_BODY="$2"
      shift 2
      ;;
    --body-file)
      BODY_FILE="$2"
      shift 2
      ;;
    --draft)
      DRAFT=true
      shift 1
      ;;
    --no-push)
      PUSH=false
      shift 1
      ;;
    --help|-h)
      cat <<'HELP'
Usage: pnpm edit:pr [--base main] [--title "..." [--body "..."] | --body-file file] [--draft] [--no-push]

- 기본 베이스 브랜치는 main입니다.
- 제목을 지정하지 않으면 마지막 커밋 메시지를 사용합니다.
- 본문을 지정하지 않으면 최신 체크포인트 경로를 포함한 템플릿을 생성합니다.
HELP
      exit 0
      ;;
    *)
      echo "[WARN] 알 수 없는 옵션: $1" >&2
      shift 1
      ;;
  esac
done

if ! command -v gh >/dev/null 2>&1; then
  echo "[ERR] GitHub CLI(gh)를 찾을 수 없습니다." >&2
  exit 1
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
LATEST_COMMIT_TITLE=$(git log -1 --pretty=%s)

if [[ -z "$PR_TITLE" ]]; then
  PR_TITLE="$LATEST_COMMIT_TITLE"
fi

if [[ -n "$BODY_FILE" ]]; then
  if [[ ! -f "$BODY_FILE" ]]; then
    echo "[ERR] body 파일을 찾을 수 없습니다: $BODY_FILE" >&2
    exit 1
  fi
  PR_BODY_CONTENT=$(cat "$BODY_FILE")
elif [[ -n "$PR_BODY" ]]; then
  PR_BODY_CONTENT="$PR_BODY"
else
  LATEST_CHECKPOINT=$(ls -1 admin/checkpoints/*.md 2>/dev/null | sort | tail -n1)
  CHECKPOINT_SECTION=""
  if [[ -n "$LATEST_CHECKPOINT" ]]; then
    CHECKPOINT_SECTION="## Checkpoint\n- ${LATEST_CHECKPOINT}\n\n"
  fi
  PR_BODY_CONTENT=$(cat <<'BODY'
## Summary
- PLACEHOLDER

BODY
  )
  PR_BODY_CONTENT=${PR_BODY_CONTENT/PLACEHOLDER/$LATEST_COMMIT_TITLE}
  PR_BODY_CONTENT+="${CHECKPOINT_SECTION}## Testing\n- [ ] pnpm run validate:docs\n- [ ] pnpm run validate:refs\n- [ ] pnpm --filter web lint\n- [ ] pnpm --filter web run build\n"
fi

TEMP_BODY=$(mktemp)
printf '%s\n' "$PR_BODY_CONTENT" > "$TEMP_BODY"

if [[ "$PUSH" == true ]]; then
  git push -u origin "$CURRENT_BRANCH"
fi

ARGS=(--base "$BASE_BRANCH" --title "$PR_TITLE" --body-file "$TEMP_BODY")
if [[ "$DRAFT" == true ]]; then
  ARGS+=(--draft)
fi

echo "ℹ️  gh pr create ${ARGS[*]}"
if gh pr create "${ARGS[@]}"; then
  echo "✅ PR 생성 완료"
else
  echo "[ERR] PR 생성에 실패했습니다." >&2
  rm -f "$TEMP_BODY"
  exit 1
fi

rm -f "$TEMP_BODY"
