#!/usr/bin/env bash
# file: scripts/validate_migrations.sh
# owner: duksan
# created: 2025-09-22 14:22 UTC / 2025-09-22 23:22 KST
# updated: 2025-09-22 14:22 UTC / 2025-09-22 23:22 KST
# purpose: Round 10 — schemaVersion 변경 감지 시 CHANGELOG와 admin/migrations 변경 존재를 검증
# doc_refs: ["admin/migrations/README.md", "CHANGELOG.md", "admin/plan/improvement-rounds.md", "admin/runbooks/release.md"]
set -euo pipefail

ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$ROOT_DIR"

# base 커밋 결정: origin/main 기준, 없으면 HEAD~1
BASE=""
if git rev-parse --verify origin/main >/dev/null 2>&1; then
  BASE=$(git merge-base HEAD origin/main)
else
  BASE=$(git rev-parse HEAD~1 2>/dev/null || echo "")
fi

# 변경 파일 수집
if [ -n "$BASE" ]; then
  CHANGED=$(git diff --name-only --diff-filter=ACMR "$BASE"...HEAD || true)
else
  CHANGED=$(git diff --name-only --diff-filter=ACMR HEAD || true)
fi

# schemaVersion 변경 감지 함수
extract_schema_ver() {
  # stdin: file content
  awk 'BEGIN{fm=0;v=""} /^---\r?$/ {fm=!fm; next} fm && /^schemaVersion:/ {print $2; exit}'
}

schema_bumps=()
changed_flag=0

for f in $CHANGED; do
  [[ $f != *.md ]] && continue
  # 이전 버전 내용
  if [ -n "$BASE" ] && git cat-file -e "$BASE:$f" 2>/dev/null; then
    oldv=$(git show "$BASE:$f" | extract_schema_ver || true)
  else
    oldv=""
  fi
  if [ -f "$f" ]; then
    newv=$(extract_schema_ver < "$f" || true)
  else
    newv=""
  fi
  if [ -n "$oldv" ] && [ -n "$newv" ] && [ "$oldv" != "$newv" ]; then
    schema_bumps+=("$f:$oldv->$newv")
  fi
done

if [ ${#schema_bumps[@]} -eq 0 ]; then
  echo "[OK] validate_migrations: schemaVersion 변경 없음" >&2
  exit 0
fi

echo "[info] schemaVersion 변경 감지: ${#schema_bumps[@]}건" >&2
for s in "${schema_bumps[@]}"; do echo " - $s" >&2; done

need_change_in_changelog=1
need_change_in_migrations=1

for f in $CHANGED; do
  [[ "$f" == "CHANGELOG.md" ]] && need_change_in_changelog=0
  [[ "$f" == admin/migrations/* || "$f" == admin/migrations/*/* ]] && need_change_in_migrations=0
done

fail=0
if [ $need_change_in_changelog -ne 0 ]; then
  echo "[ERR] schemaVersion 변경이 있는데 CHANGELOG.md 변경이 포함되지 않았습니다." >&2
  fail=1
fi
if [ $need_change_in_migrations -ne 0 ]; then
  echo "[ERR] schemaVersion 변경이 있는데 admin/migrations/ 내 변경(추가/수정)이 없습니다." >&2
  fail=1
fi

if [ $fail -ne 0 ]; then
  echo "[FAIL] validate_migrations: 요구 조건 불충족" >&2
  exit 1
fi

echo "[OK] validate_migrations: schemaVersion 변경과 동반 변경 요건 충족" >&2
exit 0
