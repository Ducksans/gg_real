#!/usr/bin/env bash
# file: scripts/secrets_scan.sh
# owner: duksan
# created: 2025-09-22 11:05 UTC / 2025-09-22 20:05 KST
# updated: 2025-09-22 11:05 UTC / 2025-09-22 20:05 KST
# purpose: 민감정보(비밀키/토큰/프라이빗키 등) 후보 문자열을 탐지. 기본은 소프트(비차단) 모드.
# usage: scripts/secrets_scan.sh [--strict]
# doc_refs: ["SECURITY.md", "THREAT_MODEL.md", "admin/plan/improvement-rounds.md"]
set -euo pipefail

STRICT=0
if [[ "${1:-}" == "--strict" ]]; then STRICT=1; fi

# 검색 실행기 선택: rg 우선, 없으면 grep 폴백
SEARCHER=""
if command -v rg >/dev/null 2>&1; then
  SEARCHER="rg --hidden --ignore-file .gitignore -n -U -g '!**/*.png' -g '!**/*.jpg' -g '!**/*.jpeg' -g '!**/*.gif' -g '!**/*.pdf' -e"
else
  echo "[secrets-scan] ripgrep(rg) 미설치: grep 폴백 사용" >&2
  SEARCHER="grep -RInE --exclude-dir=.git --exclude=*.png --exclude=*.jpg --exclude=*.jpeg --exclude=*.gif --exclude=*.pdf"
fi

echo "[secrets-scan] scanning workspace..." >&2

patterns=(
  # Private keys
  "-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY-----"
  # AWS keys
  "AKIA[0-9A-Z]{16}"
  "aws_secret_access_key\s*[:=]\s*[A-Za-z0-9/+=]{40}"
  # Generic tokens
  "(?i)(api|access|secret|token|passwd|password)\s*[:=]\s*['\"]?[A-Za-z0-9_\-]{16,}"
  # Google API key
  "AIza[0-9A-Za-z\-_]{35}"
)

found=0
for pat in "${patterns[@]}"; do
  if [[ -n "$SEARCHER" ]]; then
    if eval $SEARCHER "$pat" .; then
      found=1
    fi
  fi
done

if [[ $found -eq 1 ]]; then
  echo "[secrets-scan] 후보 문자열이 발견되었습니다. 내용 확인 필요." >&2
  if [[ $STRICT -eq 1 ]]; then
    echo "[secrets-scan] STRICT 모드: 실패 처리" >&2
    exit 1
  fi
else
  echo "[secrets-scan] 이상 없음" >&2
fi

exit 0
