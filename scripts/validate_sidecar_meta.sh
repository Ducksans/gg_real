#!/usr/bin/env bash
# file: scripts/validate_sidecar_meta.sh
# owner: duksan
# created: 2025-09-22 14:46 UTC / 2025-09-22 23:46 KST
# updated: 2025-09-22 14:46 UTC / 2025-09-22 23:46 KST
# purpose: 사이드카(.meta.yaml) 기반 메타 검사(문서/코드 주석 불가 파일 대체)
# doc_refs: ["AGENTS.md", "admin/plan/improvement-rounds.md", "admin/plan/m1-kickoff.md"]
set -euo pipefail

# 검사 범위(완화): admin/**, docs/**, 주요 루트 문서만 우선 검사
# 제외: admin/templates/**, .git, .github(워크플로는 제외), node_modules, .husky, apps/**, scripts/**, public/** (앱 자산은 경고 단계로 이관)

is_target() {
  case "$1" in
    ./admin/*|./docs/*|./AGENTS.md|./basesettings.md|./SECURITY.md|./THREAT_MODEL.md) return 0 ;;
    *) return 1 ;;
  esac
}

needs_sidecar() {
  f="$1"
  case "$f" in
    *.md|*.sh|*.ts|*.tsx|*.js|*.jsx) return 1 ;; # 자체 헤더/프런트매터로 커버
    */admin/templates/*|*.tmpl) return 1 ;;
    *.png|*.jpg|*.jpeg|*.gif|*.svg|*.pdf) return 0 ;; # 이미지류만 경고/완화 처리
    */public/*) return 1 ;; # 앱 공개 자산은 이번 라운드 제외
    */node_modules/*|*/.husky/*) return 1 ;;
    *)
      # JSON/YAML 등은 자체에 created/updated 키가 있으면 통과
      if grep -qE '(^|["[:space:]])created:' "$f" 2>/dev/null && grep -qE '(^|["[:space:]])updated:' "$f" 2>/dev/null; then
        return 1
      fi
      return 0
    ;;
  esac
}

check_meta() {
  local meta="$1"
  [ -f "$meta" ] || { echo "[ERR] missing sidecar: $meta"; return 1; }
  # created/updated(UTC/KST), 최소 한 종류의 refs(code_refs 또는 doc_refs)
  if ! grep -qE '^created: .*UTC / .*KST' "$meta"; then echo "[ERR] sidecar missing created: $meta"; return 1; fi
  if ! grep -qE '^updated: .*UTC / .*KST' "$meta"; then echo "[ERR] sidecar missing updated: $meta"; return 1; fi
  if ! grep -qE '^(code_refs|doc_refs):' "$meta"; then echo "[ERR] sidecar missing refs: $meta"; return 1; fi
  return 0
}

err=0
while IFS= read -r -d '' f; do
  is_target "$f" || continue
  case "$f" in ./admin/templates/*|*/node_modules/*|*/.husky/*|*/public/*) continue ;; esac
  if needs_sidecar "$f"; then
    meta="$f.meta.yaml"
    if ! check_meta "$meta"; then
      if [ "${ALLOW_SIDECAR_MISSING:-}" = "true" ]; then
        echo "[WARN] missing sidecar: $meta"
      else
        err=1
      fi
    fi
  fi
done < <(find . \( -path './.git' -o -path './.github' -o -path './admin/templates' -o -path './node_modules' \) -prune -o -type f -print0)

if [ $err -ne 0 ]; then
  if [ "${ALLOW_SIDECAR_MISSING:-}" = "true" ]; then
    echo "[WARN] validate_sidecar_meta: 오류를 경고로 전환 (ALLOW_SIDECAR_MISSING)" >&2
    exit 0
  fi
  echo "[FAIL] validate_sidecar_meta: 오류 발견" >&2
  exit 1
fi

echo "[OK] validate_sidecar_meta: 통과" >&2
exit 0
