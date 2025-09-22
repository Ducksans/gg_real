#!/usr/bin/env bash
# file: scripts/session_boot.sh
# owner: duksan
# created: 2025-09-22 08:26 UTC / 2025-09-22 17:26 KST
# updated: 2025-09-22 10:59 UTC / 2025-09-22 19:59 KST
# purpose: 새 세션/채팅 부팅 시 핵심 문서를 순서대로 요약 출력(MVP)
# doc_refs: ["AGENTS.md", "basesettings.md"]
set -euo pipefail

echo "=== BOOT: AGENTS.md ==="
sed -n '1,80p' AGENTS.md || true

echo "\n=== BOOT: basesettings.md ==="
sed -n '1,80p' basesettings.md || true

echo "\n=== BOOT: latest checkpoint ==="
latest=$(ls -1t admin/checkpoints/*.md 2>/dev/null | head -n1 || true)
echo "latest checkpoint: ${latest:-none}"
if [ -n "${latest:-}" ]; then sed -n '1,60p' "$latest"; fi

echo "\n=== BOOT: SoT project.json ==="
sed -n '1,80p' admin/state/project.json || true

echo "\n=== BOOT: improvement-rounds.md (head) ==="
sed -n '1,120p' admin/plan/improvement-rounds.md || true

echo "\n[INFO] Boot summary printed. Default mode: meeting until explicit解除(실행하라/반영하라)."
