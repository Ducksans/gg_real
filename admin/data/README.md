---
file: admin/data/README.md
title: 샘플 데이터 모음
owner: duksan
created: 2025-09-22 19:00 UTC / 2025-09-23 04:00 KST
updated: 2025-09-23 07:58 UTC / 2025-09-23 16:58 KST
status: active
tags: [data, template]
schemaVersion: 1
description: 관리자 UI 샘플 데이터를 관리하는 디렉터리 설명서
code_refs:
  [
    'admin/data/timeline.events.json',
    'admin/data/timeline.gantt.md',
    'admin/data/graph.json',
    'admin/data/kpi.md',
    'apps/web/src/app/admin/wiki/page.tsx',
    'apps/web/src/app/admin/tech-debt/page.tsx',
    'apps/web/src/app/admin/timeline/page.tsx',
    'apps/web/src/app/admin/graph/page.tsx',
  ]
doc_refs: ['basesettings.md', 'admin/plan/m1-kickoff.md', 'apps/web/README.md']
---

# 목적

- 프런트/백엔드 골조 개발 시 바로 활용할 수 있는 샘플 데이터를 모읍니다.

# 포함 파일

- `timeline.events.json`: SoT 기반 타임라인 이벤트 JSON.
- `timeline.gantt.md`: 초기 아이디어 공유용 Mermaid 샘플(참고용).
- `graph.json`: 의존 그래프 시각화를 위한 JSON.
- `kpi.md`: 관리자 대시보드용 KPI 표 목업.

# 사용 가이드

1. `/admin/timeline` 라우트에서 `timeline.events.json`과 `admin/state/project.json`을 기반으로 Mermaid 간트와 필터 UI를 렌더링합니다.
2. `/admin/graph` 라우트에서 `graph.json` 데이터를 React Flow 그래프로 시각화합니다.
3. `/admin/dashboard` 라우트에서 `kpi.md`를 파싱해 표 형태로 표시합니다.

# 유지보수

- 실제 데이터 연동 시에도 동일한 구조를 유지해 로컬/실시간 소스를 쉽게 교체합니다.
- 샘플 갱신 후 `pnpm run validate:docs` 및 `pnpm run validate:refs`로 프런트매터와 참조를 확인합니다.
