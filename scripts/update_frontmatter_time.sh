#!/usr/bin/env bash
# file: scripts/update_frontmatter_time.sh
# owner: duksan
# created: 2025-09-22 14:36 UTC / 2025-09-22 23:36 KST
# updated: 2025-09-22 17:35 UTC / 2025-09-23 02:35 KST
# purpose: Node 기반 타임스탬프 갱신 스크립트(scripts/update_frontmatter_time.js) 호출용 래퍼
# doc_refs: ["AGENTS.md", "docs/style-guides/markdown.md", "admin/plan/improvement-rounds.md", "admin/runbooks/release.md"]
set -euo pipefail

script_dir=$(cd "$(dirname "$0")" && pwd)
node "$script_dir/update_frontmatter_time.js" "$@"
