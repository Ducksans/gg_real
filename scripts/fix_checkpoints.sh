#!/usr/bin/env bash
# file: scripts/fix_checkpoints.sh
# owner: duksan
# created: 2025-09-22 09:25 UTC / 2025-09-22 18:25 KST
# updated: 2025-09-22 09:25 UTC / 2025-09-22 18:25 KST
# purpose: admin/checkpoints/*.md의 schemaVersion 누락과 시간 포맷(UTC/KST 동시 표기) 일괄 보정
# doc_refs: ["AGENTS.md", "docs/style-guides/markdown.md"]
set -euo pipefail

shopt -s nullglob

ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$ROOT_DIR"

changed=()

for f in admin/checkpoints/*.md; do
  bn=$(basename "$f" .md)
  if [[ "$bn" =~ ^([0-9]{8})-([0-9]{4})-UTC_([0-9]{4})-KST$ ]]; then
    ymd=${BASH_REMATCH[1]}
    hm_utc=${BASH_REMATCH[2]}
    # 파싱
    Y=${ymd:0:4}; M=${ymd:4:2}; D=${ymd:6:2}
    H=${hm_utc:0:2}; Min=${hm_utc:2:2}
    utc_iso="${Y}-${M}-${D} ${H}:${Min}"
    # epoch → KST 계산
    epoch=$(date -u -d "$utc_iso" +%s)
    kst_iso=$(TZ=Asia/Seoul date -d "@${epoch}" +"%Y-%m-%d %H:%M")

    created_line="created: ${utc_iso} UTC / ${kst_iso} KST"
    updated_line="updated: ${utc_iso} UTC / ${kst_iso} KST"

    tmp=$(mktemp)
    awk -v created_line="$created_line" -v updated_line="$updated_line" '
      BEGIN{front=0; seen_created=0; seen_updated=0; seen_schema=0}
      NR==1 && $0=="---" {front=1; print; next}
      front==1 && $0=="---" {
        if(!seen_created) print created_line
        if(!seen_updated) print updated_line
        if(!seen_schema)  print "schemaVersion: 1"
        print $0; front=2; next
      }
      front==1 {
        if($0 ~ /^created:/){ print created_line; seen_created=1; next }
        if($0 ~ /^updated:/){ print updated_line; seen_updated=1; next }
        if($0 ~ /^schemaVersion:/){ print "schemaVersion: 1"; seen_schema=1; next }
        print; next
      }
      { print }
    ' "$f" > "$tmp"

    if ! cmp -s "$f" "$tmp"; then
      cp "$f" "$f.bak"
      mv "$tmp" "$f"
      changed+=("$f")
    else
      rm -f "$tmp"
    fi
  fi
done

printf "%s\n" "${changed[@]:-}"
