---
file: admin/specs/ui-archetypes/README.md
title: 관리자 UI Archetype 템플릿 모음
owner: duksan
created: 2025-09-29 08:23 UTC / 2025-09-29 17:23 KST
updated: 2025-09-29 18:41 UTC / 2025-09-30 03:41 KST
status: draft
tags: [spec, ui, archetype, figma]
schemaVersion: 1
description: Design Contract를 충족하는 페이지 유형별 DSL 샘플과 컴포넌트 구성을 모아 Figma 플러그인 설계의 기준으로 사용한다.
doc_refs: ['admin/plan/design-contract.md', 'admin/specs/figmaplugin-p1-design.md']
---

# 개요

- 본 폴더는 관리자 페이지의 핵심 화면 유형(대시보드, 목록+필터, 상세+폼, 타임라인/그래프)에 대한 DSL 샘플과 컴포넌트 구성을 제공한다.
- 모든 샘플은 `admin/plan/design-contract.md`의 체크리스트를 충족하도록 작성하며, Figma 플러그인의 Dry-run 테스트에 즉시 적용할 수 있는 최소 구조를 포함한다.

# 문서 구성

| 파일                       | 설명                                     |
| -------------------------- | ---------------------------------------- |
| `dashboard.json`           | 현재 플러그인(v0) 스키마용 대시보드 샘플 |
| `dashboard.p2.json`        | 고도화 DSL 버전(플러그인 업데이트 대비)  |
| `dashboard/sections/`      | 대시보드 섹션 JSON (heading, kpi-row 등) |
| `list-filter/sections/`    | 목록 화면 섹션 JSON                      |
| `detail-form/sections/`    | 상세+폼 화면 섹션 JSON                   |
| `timeline-graph/sections/` | 그래프/타임라인 섹션 JSON                |
| `guardrail/sections/`      | 가드레일 테스트용 대규모 섹션 JSON       |
| `devworkspace/sections/`   | Dev Workspace 레이아웃 섹션 JSON         |

# 사용 방법

1. Design Contract의 체크리스트를 먼저 검토해 페이지 조건을 확정한다.
2. 섹션 JSON(`*/sections/*.json`)을 선택해 필요한 조합을 구성하거나, v0 템플릿을 사용해 전체 레이아웃을 생성한다.
3. 플러그인 Dry-run을 실행해 오류/경고가 없는지 확인하고, 결과를 Dev Workspace 승인 플로에 기록한다.
4. 변경 사항은 섹션 단위로 버전 업(`@v1`, `@v2`) 파일을 추가하고 체크포인트에 반영한다.

# 다음 단계

- 페이지별 변형(예: `dashboard-compact`, `list-analytics`)을 추가로 작성한다.
- 실제 토큰 값과 컴포넌트 레지스트리 ID를 유지하기 위해 자동 생성 스크립트를 도입한다.
