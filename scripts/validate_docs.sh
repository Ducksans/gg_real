#!/usr/bin/env bash
# file: scripts/validate_docs.sh
# owner: duksan
# created: 2025-09-22 08:25 UTC / 2025-09-22 17:25 KST
# updated: 2025-09-22 09:22 UTC / 2025-09-22 18:22 KST
# purpose: 문서 검증(MVP) + 목록 번호 규칙(MD029 대체 검사)
# doc_refs: ["docs/style-guides/markdown.md", "AGENTS.md", "basesettings.md", "admin/runbooks/release.md", "admin/runbooks/rollback.md", "admin/plan/m1-kickoff.md"]

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
  echo "[info] markdownlint 검사 실행(.markdownlint.json)" >&2
  if ! markdownlint -q -c .markdownlint.json "**/*.md"; then
    echo "[ERR] markdownlint MD029 실패"; fail=1
  fi
else
  # 2) 도구가 없으면 간단한 휴리스틱: 동일 파일에서 1./1./1.이 3줄 이상 연속되면 경고
  echo "[info] markdownlint 미설치: 휴리스틱 검사 수행" >&2
  while IFS= read -r -d '' md; do
    if awk '
      /^1[.)] /{ c++; } !/^1[.)] /{ c=0 }
      END{ exit (c>=3?0:1) }
    ' "$md"; then
      echo "[WARN] 의심스러운 번호 목록(1. 반복): $md"
    fi
  done < <(find . -type f -name '*.md' -print0)
fi

# support-matrix 존재 및 필수 키 검사(간단)
if [ ! -f admin/config/support-matrix.yaml ]; then
  echo "[ERR] missing support-matrix: admin/config/support-matrix.yaml"; fail=1
else
  for key in browsers os devices; do
    if ! grep -qE "^${key}:" admin/config/support-matrix.yaml; then
      echo "[ERR] support-matrix missing key: $key"; fail=1
    fi
  done
fi

# hub manifests 간단 검사(도구 미설치 환경용 최소 체크)
if ls admin/manifests/*.yaml >/dev/null 2>&1; then
  for y in admin/manifests/*.yaml; do
    # 메타 사이드카는 제외
    case "$y" in *.meta.yaml) continue ;; esac
    for key in id name type stage owner; do
      if ! grep -qE "^${key}:" "$y"; then echo "[ERR] hub manifest missing key: $key in $y"; fail=1; fi
    done
    if ! grep -qE '^type: (service|job|doc|ui|data)$' "$y"; then echo "[ERR] hub manifest type invalid: $y"; fail=1; fi
    if ! grep -qE '^stage: (design|proto|dev|test|prod)$' "$y"; then echo "[ERR] hub manifest stage invalid: $y"; fail=1; fi
  done
fi

exit $fail
