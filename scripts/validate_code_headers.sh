#!/usr/bin/env bash
# file: scripts/validate_code_headers.sh
# owner: duksan
# created: 2025-09-22 14:45 UTC / 2025-09-22 23:45 KST
# updated: 2025-09-22 14:45 UTC / 2025-09-22 23:45 KST
# purpose: 코드 파일 헤더(생성/업데이트/상호참조) 강제 검사
# doc_refs: ["AGENTS.md", "admin/templates/code-header.ts.tmpl", "admin/templates/code-header.sh.tmpl"]
set -euo pipefail

shopt -s nullglob

is_code_file() {
  case "$1" in
    *.sh|*.ts|*.tsx|*.js|*.jsx) return 0 ;;
    *) return 1 ;;
  esac
}

is_exempt() {
  case "$1" in
    */admin/templates/*|*.tmpl) return 0 ;;
    */node_modules/*) return 0 ;;
    *) return 1 ;;
  esac
}

err=0

while IFS= read -r -d '' f; do
  is_code_file "$f" || continue
  is_exempt "$f" || continue

  header=$(head -n 60 "$f" | tr -d '\r')

  # created/updated 검사(UTC / KST 동시 표기)
  if ! grep -qE 'created: .*UTC / .*KST' <<< "$header"; then
    echo "[ERR] missing created (UTC/KST) in header: $f"; err=1
  fi
  if ! grep -qE 'updated: .*UTC / .*KST' <<< "$header"; then
    echo "[ERR] missing updated (UTC/KST) in header: $f"; err=1
  fi

  # doc_refs: [ ... ] 형태 검사
  if ! grep -qE 'doc_refs:\s*\[' <<< "$header"; then
    echo "[ERR] missing doc_refs in header: $f"; err=1
  fi
done < <(find . \( -path './.git' -o -path './admin/templates' -o -path './.github' \) -prune -o -type f -print0)

if [ $err -ne 0 ]; then
  echo "[FAIL] validate_code_headers: 오류 발견" >&2
  exit 1
fi

echo "[OK] validate_code_headers: 통과" >&2
exit 0

