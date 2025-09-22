#!/usr/bin/env bash
# file: scripts/backfill_metadata.sh
# owner: duksan
# created: 2025-09-22 14:48 UTC / 2025-09-22 23:48 KST
# updated: 2025-09-22 14:48 UTC / 2025-09-22 23:48 KST
# purpose: 레포 전체 메타 백필(dry-run 기본). 문서 frontmatter/코드 헤더/사이드카를 보강.
# usage: scripts/backfill_metadata.sh [--apply]
# doc_refs: ["admin/templates/doc-frontmatter.md", "admin/templates/code-header.ts.tmpl", "admin/templates/code-header.sh.tmpl", "AGENTS.md"]
set -euo pipefail

APPLY=0
if [[ "${1:-}" == "--apply" ]]; then APPLY=1; fi

UTC_STR=$(date -u '+%Y-%m-%d %H:%M')
KST_STR=$(TZ=Asia/Seoul date '+%Y-%m-%d %H:%M')

say() { echo "$@" >&2; }

ensure_dir() { mkdir -p "$(dirname "$1")"; }

is_md() { [[ "$1" == *.md ]]; }
is_code() { case "$1" in *.sh|*.ts|*.tsx|*.js|*.jsx) return 0;; *) return 1;; esac; }
is_exempt() { case "$1" in */admin/templates/*|*.tmpl|*/node_modules/*) return 0;; *) return 1;; esac; }

backfill_doc() {
  local f="$1"; local changed=0
  # frontmatter 없으면 삽입
  if ! head -n1 "$f" | grep -qx -- '---'; then
    changed=1
    tmp=$(mktemp)
    cat > "$tmp" <<EOF
---
file: ${f#./}
title: TITLE
owner: duksan
created: ${UTC_STR} UTC / ${KST_STR} KST
updated: ${UTC_STR} UTC / ${KST_STR} KST
status: in_progress
tags: []
schemaVersion: 1
description: TBD
code_refs: []
---

EOF
    cat "$f" >> "$tmp"
    if (( APPLY )); then mv "$tmp" "$f"; say "[apply][doc] frontmatter added: $f"; else rm -f "$tmp"; say "[dry-run][doc] frontmatter would be added: $f"; fi
  fi
}

backfill_code() {
  local f="$1"; local changed=0
  header=$(head -n 1 "$f" 2>/dev/null || true)
  if [[ "$f" == *.sh ]]; then
    if ! grep -q '^#' <<< "$header"; then
      changed=1
      tmp=$(mktemp)
      cat > "$tmp" <<EOF
#!/usr/bin/env bash
# file: ${f#./}
# owner: duksan
# created: ${UTC_STR} UTC / ${KST_STR} KST
# updated: ${UTC_STR} UTC / ${KST_STR} KST
# purpose: TODO
# doc_refs: ["AGENTS.md", "admin/plan/improvement-rounds.md"]

EOF
      cat "$f" >> "$tmp"
      if (( APPLY )); then mv "$tmp" "$f"; say "[apply][code] header added: $f"; else rm -f "$tmp"; say "[dry-run][code] header would be added: $f"; fi
    fi
  else
    # TS/JS류는 블록 코멘트
    if ! grep -qE '^/\*\*' <<< "$header"; then
      changed=1
      tmp=$(mktemp)
      cat > "$tmp" <<EOF
/**
 * file: ${f#./}
 * owner: duksan
 * created: ${UTC_STR} UTC / ${KST_STR} KST
 * updated: ${UTC_STR} UTC / ${KST_STR} KST
 * purpose: TODO
 * doc_refs: ["AGENTS.md", "admin/plan/improvement-rounds.md"]
 */

EOF
      cat "$f" >> "$tmp"
      if (( APPLY )); then mv "$tmp" "$f"; say "[apply][code] header added: $f"; else rm -f "$tmp"; say "[dry-run][code] header would be added: $f"; fi
    fi
  fi
}

backfill_sidecar() {
  local f="$1"
  local meta="$f.meta.yaml"
  if [ -f "$meta" ]; then return 0; fi
  ensure_dir "$meta"
  if (( APPLY )); then
    cat > "$meta" <<EOF
created: ${UTC_STR} UTC / ${KST_STR} KST
updated: ${UTC_STR} UTC / ${KST_STR} KST
doc_refs: ["AGENTS.md"]
EOF
    say "[apply][meta] sidecar added: $meta"
  else
    say "[dry-run][meta] sidecar would be added: $meta"
  fi
}

while IFS= read -r -d '' f; do
  case "$f" in ./.git/*|./admin/templates/*|*/node_modules/*) continue ;; esac
  if is_md "$f"; then
    backfill_doc "$f"
  elif is_code "$f"; then
    is_exempt "$f" || continue
    backfill_code "$f"
  else
    # 문서/코드 아닌 대상 중, created/updated 키 자체 포함 파일은 패스
    if grep -qE '(^|["[:space:]])created:' "$f" 2>/dev/null && grep -qE '(^|["[:space:]])updated:' "$f" 2>/dev/null; then
      :
    else
      # 프로젝트 주요 영역만 사이드카 부여
      case "$f" in ./admin/*|./apps/*|./scripts/*|./docs/*) backfill_sidecar "$f" ;; esac
    fi
  fi
done < <(find . -type f -print0)

exit 0
