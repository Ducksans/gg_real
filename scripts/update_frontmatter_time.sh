#!/usr/bin/env bash
# file: scripts/update_frontmatter_time.sh
# owner: duksan
# created: 2025-09-22 14:36 UTC / 2025-09-22 23:36 KST
# updated: 2025-09-22 14:36 UTC / 2025-09-22 23:36 KST
# purpose: 변경된 Markdown 파일의 frontmatter `updated:` 값을 현재 시각(UTC/KST)으로 자동 갱신
# doc_refs: ["AGENTS.md", "docs/style-guides/markdown.md"]
set -euo pipefail

# 대상 파일 목록: 인자로 받으면 그 목록, 없으면 git staged 중 .md
files=("$@")
if [ ${#files[@]} -eq 0 ]; then
  mapfile -t files < <(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.md$' || true)
fi

[ ${#files[@]} -eq 0 ] && exit 0

UTC_STR=$(date -u '+%Y-%m-%d %H:%M')
KST_STR=$(TZ=Asia/Seoul date '+%Y-%m-%d %H:%M')

update_one() {
  local f="$1"
  [ -f "$f" ] || return 0
  # frontmatter가 맨 위에 있고 updated 키가 있을 때만 교체
  if ! head -n1 "$f" | grep -qx '---'; then return 0; fi
  if ! awk 'BEGIN{fm=0;u=0} /^---$/{fm=!fm; next} fm && /^updated:/{u=1} END{exit (u?0:1)}' "$f"; then return 0; fi
  tmp=$(mktemp)
  awk -v u="updated: ${UTC_STR} UTC / ${KST_STR} KST" '
    BEGIN{fm=0}
    NR==1 && $0=="---" {fm=1; print; next}
    fm==1 && /^updated:/ { print u; next }
    print
    fm==1 && /^---$/ { fm=2 }
  ' "$f" > "$tmp"
  if ! cmp -s "$f" "$tmp"; then
    mv "$tmp" "$f"
    git add "$f" >/dev/null 2>&1 || true
    echo "[stamp] updated refreshed: $f" >&2
  else
    rm -f "$tmp"
  fi
}

for f in "${files[@]}"; do update_one "$f"; done

exit 0

