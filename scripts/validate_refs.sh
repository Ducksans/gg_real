#!/usr/bin/env bash
/*
 File: scripts/validate_refs.sh
 Owner: duksan
 Created: 2025-09-22 08:26 UTC / 2025-09-22 17:26 KST
 Updated: 2025-09-22 08:26 UTC / 2025-09-22 17:26 KST
 Purpose: 문서의 code_refs 경로 존재 여부를 간단 검증(MVP)
*/
set -euo pipefail

fail=0

grep -R "^code_refs:" -n -- *.md admin 2>/dev/null | while IFS=: read -r file _ _; do
  # 해당 파일의 frontmatter 전체에서 code_refs 항목만 추출
  refs=$(awk 'BEGIN{in=0} /^---$/{in=!in; next} in{print}' "$file" | awk '/^code_refs:/{flag=1;print;next} /^\w+:/&&flag{flag=0} flag' | sed -n 's/^- \"\(.*\)\"/\1/p')
  for r in $refs; do
    if [ ! -e "$r" ]; then echo "[ERR] missing code ref: $file -> $r"; fail=1; fi
  done
done

exit ${fail:-0}
