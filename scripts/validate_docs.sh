#!/usr/bin/env bash
# file: scripts/validate_docs.sh
# owner: duksan
# created: 2025-09-22 08:25 UTC / 2025-09-22 17:25 KST
# updated: 2025-09-22 09:22 UTC / 2025-09-22 18:22 KST
# purpose: 문서 검증(MVP) + 목록 번호 규칙(MD029 대체 검사)
# doc_refs: ["docs/style-guides/markdown.md", "AGENTS.md"]

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

# 목록 번호 규칙 검사(재발 방지)
# 1) markdownlint가 있으면 MD029(style: ordered)로 검사
if command -v markdownlint >/dev/null 2>&1; then
  echo "[info] markdownlint MD029 검사 실행" >&2
  if ! markdownlint -q -r MD029 .; then
    echo "[ERR] markdownlint MD029 실패"; fail=1
  fi
else
  # 2) 도구가 없으면 간단한 휴리스틱: 동일 파일에서 1./1./1.이 3줄 이상 연속되면 경고
  echo "[info] markdownlint 미설치: 휴리스틱 검사 수행" >&2
  while IFS= read -r -d '' md; do
    if awk '/^1[.)] /{c++; if(c>=3){print FILENAME; exit 0}} !/^1[.)] /{c=0}' "$md" >/dev/null; then
      echo "[WARN] 의심스러운 번호 목록(1. 반복): $md"; fi
  done < <(find . -type f -name '*.md' -print0)
fi

exit $fail
