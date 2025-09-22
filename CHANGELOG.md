---
file: CHANGELOG.md
title: 변경 로그
owner: duksan
created: 2025-09-22 14:22 UTC / 2025-09-22 23:22 KST
updated: 2025-09-22 14:22 UTC / 2025-09-22 23:22 KST
status: active
tags: [changelog, governance]
schemaVersion: 1
description: 스키마/거버넌스 관련 변경을 포함한 변경 로그
code_refs: ["scripts/validate_migrations.sh", "admin/migrations/README.md"]
---

# 가이드
- 스키마(문서/코드 메타의 schemaVersion) 변경 시, 해당 변경과 함께 이 파일을 업데이트합니다.
- 각 항목에는 날짜(UTC/KST), 관련 파일, 요약, 마이그레이션 파일명을 포함합니다.

# 2025-09-22
- 초기 도입(R10): 마이그레이션 거버넌스, 검증 스크립트, 템플릿 추가
  - scripts/validate_migrations.sh 추가
  - admin/migrations/README.md 및 templates 추가
  - docs-validate CI에 마이그 검증 추가 예정

