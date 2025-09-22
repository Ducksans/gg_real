#!/usr/bin/env bash
# file: scripts/checkpoint.sh
# owner: duksan
# created: 2025-09-22 09:38 UTC / 2025-09-22 18:38 KST
# updated: 2025-09-22 18:10 UTC / 2025-09-23 03:10 KST
# purpose: 변경 파일 자동 수집→체크포인트 문서 생성(admin/checkpoints/*.md)
# doc_refs: ["AGENTS.md", "admin/plan/improvement-rounds.md", "docs/style-guides/markdown.md", "basesettings.md"]
set -euo pipefail

ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$ROOT_DIR"


validate_frontmatter() {
  local file="$1"
  [ -f "$file" ] || return 0
  if ! head -n1 "$file" | grep -qx -- '---'; then
    echo "[ERR] $file: frontmatter 시작 구분자(---) 누락" >&2
    return 1
  fi
  local required=(file title owner created updated status schemaVersion)
  local missing=0
  for key in "${required[@]}"; do
    if ! grep -qE -- "^${key}:" "$file"; then
      echo "[ERR] $file: frontmatter ${key} 키 누락" >&2
      missing=1
    fi
  done
  if ! grep -qE -- '^created: [0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2} UTC / [0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2} KST$' "$file"; then
    echo "[ERR] $file: created 형식(UTC / KST) 불일치" >&2
    missing=1
  fi
  if ! grep -qE -- '^updated: [0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2} UTC / [0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2} KST$' "$file"; then
    echo "[ERR] $file: updated 형식(UTC / KST) 불일치" >&2
    missing=1
  fi
  return $missing
}

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
sha_short=$(git rev-parse --short HEAD 2>/dev/null || echo "0000000")

# 시간 계산
UTC_STR=$(date -u '+%Y-%m-%d %H:%M')
KST_STR=$(TZ=Asia/Seoul date '+%Y-%m-%d %H:%M')
STAMP_UTC=$(date -u '+%Y%m%d-%H%M')
STAMP_KST=$(TZ=Asia/Seoul date '+%H%M')
OUT="admin/checkpoints/${STAMP_UTC}-UTC_${STAMP_KST}-KST.md"

# 변경 파일 목록 수집(working tree + staged)
# 형식: XY <path>
status=$(git status --porcelain=1)

added=()
modified=()
deleted=()
renamed=()
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  x=${line:0:1}; y=${line:1:1}
  rest=${line:3}
  case "$x$y" in
    A*|*A) added+=("$rest") ;;
    M*|*M) modified+=("$rest") ;;
    D*|*D) deleted+=("$rest") ;;
    R*)    # git may print: R  old -> new
           path=$(echo "$rest" | awk -F' -> ' '{print $2}')
           renamed+=("$path") ;;
    *) :;;
  esac
done <<< "$status"

total_changes=$(( ${#added[@]} + ${#modified[@]} + ${#deleted[@]} + ${#renamed[@]} ))

meta_fail=0
for file in "${added[@]}" "${modified[@]}"; do
  [[ -z "$file" ]] && continue
  case "$file" in
    *.md)
      if ! validate_frontmatter "$file"; then
        meta_fail=1
      fi
      ;;
  esac
done

if [ $meta_fail -ne 0 ]; then
  echo "[FAIL] checkpoint: 필수 메타 검증 실패" >&2
  exit 1
fi


mkdir -p admin/checkpoints

{
  echo "---"
  echo "file: $OUT"
  echo "title: 체크포인트 - 변경 자동 수집(${total_changes}건)"
  echo "owner: duksan"
  echo "created: ${UTC_STR} UTC / ${KST_STR} KST"
  echo "updated: ${UTC_STR} UTC / ${KST_STR} KST"
  echo "status: completed"
  echo "tags: [checkpoint, automation]"
  echo "schemaVersion: 1"
  echo "description: git status 기반으로 변경 파일을 자동 수집하여 체크포인트를 생성. branch=${branch}, head=${sha_short}"
  echo "---"
  echo
  echo "## 변경 파일 요약"
  echo "- 브랜치: ${branch}"
  echo "- HEAD: ${sha_short}"
  echo "- 변경 수: ${total_changes}"
  echo
  echo "## Added(${#added[@]})"
  for f in "${added[@]}"; do echo "- $f"; done
  echo
  echo "## Modified(${#modified[@]})"
  for f in "${modified[@]}"; do echo "- $f"; done
  echo
  echo "## Deleted(${#deleted[@]})"
  for f in "${deleted[@]}"; do echo "- $f"; done
  echo
  echo "## Renamed(${#renamed[@]})"
  for f in "${renamed[@]}"; do echo "- $f"; done
  echo
  echo "## 비고"
  echo "- 이 파일은 scripts/checkpoint.sh로 생성되었습니다."
} > "$OUT"

echo "$OUT"
