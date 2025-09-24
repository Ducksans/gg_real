---
file: admin/templates/README.md
title: Admin 템플릿 사용 가이드
owner: duksan
created: 2025-09-22 18:44 UTC / 2025-09-23 03:45 KST
updated: 2025-09-22 18:59 UTC / 2025-09-23 03:59 KST
status: active
tags: [docs, template]
schemaVersion: 1
description: admin 폴더 내 문서/코드/체크포인트 템플릿 사용 지침
code_refs:
  [
    'scripts/validate_docs.sh',
    'scripts/validate_refs.sh',
    'scripts/update_frontmatter_time.js',
    'scripts/checkpoint.sh',
  ]
---

# 목적

- admin 폴더의 문서와 코드가 동일한 프런트매터 규칙을 따르도록 템플릿 사용법을 정리합니다.

# 문서 템플릿(`doc-frontmatter.md`)

- `file` 경로는 repo 루트 기준 절대 경로를 넣습니다.
- `created`/`updated`는 `YYYY-MM-DD HH:MM UTC / YYYY-MM-DD HH:MM KST` 형태를 유지합니다.
- `code_refs`와 `doc_refs`는 실제 존재하는 파일을 적고, 상대 파일에는 대응 `doc_refs`/`code_refs`를 추가합니다.
- 새 문서를 만들 때는 템플릿 내용을 복사한 뒤 `scripts/update_frontmatter_time.js`로 타임스탬프를 맞춥니다.

# 코드 헤더 템플릿(`code-header.{ts,sh}.tmpl`)

- 파일 상단에 owner/created/updated/purpose를 입력하고 `doc_refs`로 관련 문서를 명시합니다.
- TypeScript/JavaScript, Shell 스크립트 헤더에 각각 맞춘 버전을 사용합니다.

# 체크포인트 템플릿(`checkpoint-frontmatter.md`)

- `scripts/checkpoint.sh`가 자동 생성하는 형식을 수동으로 작성할 때 참고합니다.
- 변경 파일 수, Added/Modified/Deleted/ Renamed 섹션을 상황에 맞게 채웁니다.

# 검증 플로우

1. 변경 후 `pnpm run validate:docs`로 프런트매터 구조를 확인합니다.
2. `pnpm run validate:refs`로 code_refs/doc_refs 상호 참조를 검증합니다.
3. 문제가 없으면 `scripts/checkpoint.sh`로 체크포인트를 남깁니다.
