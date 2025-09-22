---
file: admin/data/README.md
title: 샘플 데이터 모음
owner: duksan
created: 2025-09-22 19:05 UTC / 2025-09-23 04:05 KST
updated: 2025-09-22 18:59 UTC / 2025-09-23 03:59 KST
status: active
tags: [data, template]
schemaVersion: 1
description: 관리자 UI 샘플 데이터를 관리하는 디렉터리 설명서
code_refs: ['admin/data/timeline.gantt.md', 'admin/data/graph.json', 'admin/data/kpi.md']
doc_refs: ['basesettings.md', 'admin/plan/m1-kickoff.md']
---

# 목적

- 프런트/백엔드 골조 개발 시 바로 활용할 수 있는 샘플 데이터를 모읍니다.

# 포함 파일

- `timeline.gantt.md`: Mermaid 간트 예시.
- `graph.json`: 의존 그래프 시각화를 위한 JSON.
- `kpi.md`: 관리자 대시보드용 KPI 표 목업.

# 사용 가이드

1. `/admin/timeline` 라우트에서 `timeline.gantt.md`를 읽어 Mermaid 렌더러 입력으로 사용합니다.
2. `/admin/graph` 라우트에서 `graph.json` 데이터를 React Flow 등 그래프 뷰어에 매핑합니다.
3. `/admin/dashboard` 라우트에서 `kpi.md`를 파싱해 표 형태로 표시합니다.

# 유지보수

- 실제 데이터 연동 시에도 동일한 구조를 유지해 로컬/실시간 소스를 쉽게 교체합니다.
- 샘플 갱신 후 `pnpm run validate:docs` 및 `pnpm run validate:refs`로 프런트매터와 참조를 확인합니다.
