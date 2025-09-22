#!/usr/bin/env bash
# file: scripts/validate_refs.sh
# owner: duksan
# created: 2025-09-22 08:26 UTC / 2025-09-22 17:26 KST
# updated: 2025-09-22 10:59 UTC / 2025-09-22 19:59 KST
# purpose: 문서↔코드 상호 참조 검증(R9) — 경로 존재/패턴/쌍방 매칭/데드 링크 리포트
# doc_refs: ["admin/plan/improvement-rounds.md", "AGENTS.md", "admin/runbooks/release.md"]
set -euo pipefail

shopt -s nullglob

declare -A doc_to_codes
declare -A code_to_docs

err=0

# helper: normalize path to prefix with ./ if relative
norm_rel() {
  local p="$1"
  case "$p" in
    /*|./*) printf "%s" "$p" ;;
    *) printf "./%s" "$p" ;;
  esac
}

# helper: extract frontmatter block
extract_frontmatter() {
  awk 'BEGIN{fm=0} /^---\r?$/ { fm = !fm; next } fm { print }' "$1"
}

# helper: parse YAML array under a key from frontmatter
parse_yaml_array() {
  # $1: key, reads stdin(frontmatter)
  awk -v key="$1" '
    # inline form: key: ["a", "b"]
    $0 ~ "^"key":[[:space:]]*\\[" { 
      line=$0
      sub(/^.*\[/, "", line); sub(/\].*$/, "", line)
      n=split(line, arr, /, */)
      for(i=1;i<=n;i++){ gsub(/^\"|\"$/, "", arr[i]); print arr[i] }
      next
    }
    # block form:
    $0 ~ "^"key":" { open=1; next }
    open && /^\w+:/ { open=0 }
    open && /^-[[:space:]]+\".*\"/ { gsub(/^-[[:space:]]+\"|\"$/, ""); print }
  '
}

# 1) 문서에서 code_refs 수집 및 존재/패턴 검증
for doc in ./*.md admin/**/*.md docs/**/*.md; do
  [ -f "$doc" ] || continue
  # 템플릿 디렉토리는 검사 제외
  case "$doc" in ./admin/templates/*|admin/templates/*) continue ;; esac
  fm=$(extract_frontmatter "$doc")
  refs=$(printf "%s\n" "$fm" | parse_yaml_array code_refs || true)
  if [ -n "$refs" ]; then
    while IFS= read -r code; do
      # 존재 검사
      if [ ! -e "$code" ]; then
        echo "[ERR] missing code file (from doc): $doc -> $code"
        err=1
        continue
      fi
      # (선택) 간단 패턴: 코드 파일은 scripts/|apps/|packages/|.*\.(ts|tsx|js|jsx|sh)$
      case "$code" in
        scripts/*|apps/*|packages/*|*.ts|*.tsx|*.js|*.jsx|*.sh) : ;;
        *) echo "[WARN] code_ref atypical path: $doc -> $code" ;;
      esac
      doc_to_codes["$(norm_rel "$doc")"]+=" $(norm_rel "$code")"
    done <<< "$refs"
  fi
done

# 2) 코드에서 doc_refs 수집 및 존재 검사(헤더 100줄 내에서 검색)
while IFS= read -r -d '' codef; do
  header=$(head -n 100 "$codef" | tr -d '\r')
  if grep -qE 'doc_refs:[[:space:]]*\[' <<< "$header"; then
    # 추출: "path1", "path2"
    line=$(grep -E 'doc_refs:[[:space:]]*\[' <<< "$header" | head -n1)
    inner=$(sed -n 's/.*doc_refs:[[:space:]]*\[\(.*\)\].*/\1/p' <<< "$line")
    # 쉼표 분리하여 양쪽 공백 제거
    IFS=',' read -ra arr <<< "$inner"
    for item in "${arr[@]}"; do
      d=$(sed -e 's/^[[:space:]]*\"//; s/\"[[:space:]]*$//' <<< "$item")
      [ -z "$d" ] && continue
      if [ ! -f "$d" ]; then
        echo "[ERR] missing doc file (from code): $codef -> $d"
        err=1
        continue
      fi
      code_to_docs["$codef"]+=" $(norm_rel "$d")"
    done
  fi
done < <(find . -type f \( -name "*.sh" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -print0)

# 3) 쌍방 매칭 검사
#   a) doc -> code 존재 시, code의 doc_refs에 해당 doc가 포함되어야 함
for doc in "${!doc_to_codes[@]}"; do
  for code in ${doc_to_codes["$doc"]}; do
    listed_docs=${code_to_docs["$code"]:-}
    # 코드가 scripts/* 또는 apps/* 위치에 있는데 doc_refs가 없다면 오류(템플릿/샘플 제외)
    if [ -z "$listed_docs" ]; then
      case "$code" in
        ./scripts/*|./apps/*)
          case "$code" in *.tmpl|*.sample.*) : ;; *) echo "[ERR] missing doc_refs in code header: $code"; err=1 ;; esac
        ;;
      esac
      continue
    fi
    found=0
    for d in $listed_docs; do [ "$d" = "$doc" ] && found=1 && break; done
    if [ $found -eq 0 ]; then
      echo "[ERR] missing reciprocal doc_ref: $code -> $doc"
      err=1
    fi
  done
done

#   b) code -> doc 존재 시, 해당 doc의 code_refs에 code가 포함되어야 함
for code in "${!code_to_docs[@]}"; do
  for doc in ${code_to_docs["$code"]}; do
    # 문서 reciprocal 검사는 Markdown(frontmatter 보유)인 경우에만 수행
    case "$doc" in *.md) : ;; *) continue ;; esac
    fm=$(extract_frontmatter "$doc")
    refs=$(printf "%s\n" "$fm" | parse_yaml_array code_refs || true)
    has=0
    while IFS= read -r r; do [ "$(norm_rel "$r")" = "$code" ] && has=1 && break; done <<< "$refs"
    if [ $has -eq 0 ]; then
      echo "[ERR] missing reciprocal code_ref: $doc -> $code"
      err=1
    fi
  done
done

# 요약
if [ $err -ne 0 ]; then
  echo "[FAIL] validate_refs: 상호 참조 오류가 있습니다." >&2
else
  echo "[OK] validate_refs: 상호 참조/경로 검증 통과" >&2
fi

exit $err
