#!/usr/bin/env bash
/*
 File: scripts/validate_docs.sh
 Owner: duksan
 Created: 2025-09-22 08:25 UTC / 2025-09-22 17:25 KST
 Updated: 2025-09-22 08:25 UTC / 2025-09-22 17:25 KST
 Purpose: 간단한 문서 검증(프런트매터 존재, 필수 키, 시간 포맷) - MVP
*/
set -euo pipefail

shopt -s nullglob

fail=0
for f in *.md admin/**/*.md; do
  # 프런트매터 구간 확인
  if ! awk 'NR==1{exit ($0=="---"?0:1)}' "$f" >/dev/null 2>&1; then
    echo "[ERR] no frontmatter: $f"; fail=1; continue
  fi
  # 필수 키 확인
  for key in file title owner created updated status schemaVersion; do
    if ! grep -qE "^$key:" "$f"; then echo "[ERR] missing $key: $f"; fail=1; fi
  done
  # created/updated 포맷(UTC / KST 동시 표기) 대략 검사
  if ! grep -qE '^created: .*UTC / .*KST' "$f"; then echo "[ERR] created time format: $f"; fail=1; fi
  if ! grep -qE '^updated: .*UTC / .*KST' "$f"; then echo "[ERR] updated time format: $f"; fail=1; fi
done

exit $fail
