---
file: admin/migrations/README.md
title: 마이그레이션 거버넌스(R10)
owner: duksan
created: 2025-09-22 14:22 UTC / 2025-09-22 23:22 KST
updated: 2025-09-22 14:22 UTC / 2025-09-22 23:22 KST
status: active
tags: [governance, migrations]
schemaVersion: 1
description: schemaVersion 변경 시 절차/템플릿/검증 규칙
code_refs: ["scripts/validate_migrations.sh", "admin/migrations/templates/migration.sh.tmpl", "admin/migrations/templates/migration.md.tmpl"]
---

# 목적
- 문서/코드 메타의 `schemaVersion` 변경을 추적 가능하게 만들고, 변경 로그와 실제 마이그레이션 절차를 강제합니다.

# 절차(요약)
- 1. 변경 범위 파악: 어떤 파일들의 `schemaVersion`이 변경되는지 확인
- 2. 마이그 파일 생성: `admin/migrations/YYYYMMDD-HHMM-<slug>.md` 또는 `.sh`
- 3. CHANGELOG 업데이트: 날짜/요약/관련 파일/마이그 파일명 기록
- 4. 검증: `scripts/validate_migrations.sh` 실행(로컬/CI)

# 파일 규칙
- 네이밍: `YYYYMMDD-HHMM-<slug>.(md|sh)`
- 내용: 무엇이 왜 바뀌는지, 적용/롤백 방법

# 롤백
- 마이그 문서의 롤백 절차를 따르고, 체크포인트와 태그를 활용합니다.

