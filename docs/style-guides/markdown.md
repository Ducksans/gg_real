---
file: docs/style-guides/markdown.md
title: Markdown 스타일 가이드(목록/우선순위 표기 규칙)
owner: duksan
created: 2025-09-22 09:22 UTC / 2025-09-22 18:22 KST
updated: 2025-09-22 09:22 UTC / 2025-09-22 18:22 KST
status: active
tags: [docs, style, markdown]
schemaVersion: 1
description: 채팅/문서 환경에서 일관된 목록 번호와 우선순위 표기 규칙 정의
code_refs: ["scripts/validate_docs.sh", "scripts/fix_checkpoints.sh", "scripts/checkpoint.sh"]
---

# 목적
- 편집기·렌더러마다 번호 목록 처리 방식이 달라 발생하는 혼란을 제거한다.

# 규칙
- 채팅/이슈/PR 코멘트: 자동 번호 금지. `P1)`/`[P1]` 또는 `1)` 형태 사용.
- 문서(.md): `1. 2. 3.` 순번을 명시하고, 리스트 내부에는 불필요한 빈 줄을 넣지 않는다.
- 모든 항목을 `1.`로만 적는 패턴 금지(일부 렌더러에서 전부 1로 보임).
- 소제목/코드블록 경계에서 리스트가 끊어질 수 있으니 의도적으로 동일 리스트를 유지한다.

# 검증
- markdownlint MD029을 `ordered`로 강제한다.
- 도구가 없을 때는 스크립트가 3줄 이상 연속된 `^1[.)] ` 패턴을 경고한다.
