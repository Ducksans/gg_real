---
file: admin/plan/figmaplugin-terminology.md
title: Figma Plugin 용어 맵핑 표
owner: duksan
created: 2025-10-01 05:10 UTC / 2025-10-01 14:10 KST
updated: 2025-10-01 16:11 UTC / 2025-10-02 01:11 KST
status: draft
tags: [plan, figma, glossary]
schemaVersion: 1
description: 플러그인 설계 문서·Figma 디자인·코드 간 용어를 일치시키기 위한 매핑 표
doc_refs: ['admin/plan/figmapluginmake.md', 'admin/plan/figmaplugin-roadmap.md']
code_refs:
  [
    'figma-hello-plugin/src/ui/store',
    'figma-hello-plugin/src/ui/components',
    'figma-hello-plugin/src/runtime',
  ]
---

> 설계 문서(`admin/plan/figmapluginmake.md`)와 실행 로드맵(`admin/plan/figmaplugin-roadmap.md`)을 해석할 때 본 표를 기준 용어로 사용한다.

| 개념               | 설계 문서 표기             | Figma 레이어 예시                | 코드/스토어 키                                                 | 설명 및 비고                                                                                         |
| ------------------ | -------------------------- | -------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Surface (L1)       | Design Surface, Surface 탭 | `Surface/admin-dashboard` 프레임 | `surfaceStore.currentSurfaceId`, `surface-config`              | 가장 상위 디자인 영역. Route 목록을 포함하며 플러그인 실행 대상 페이지와 연결된다.                   |
| Route (L2)         | Route 그룹                 | `Route/list-filter` 그룹         | `routeStore.routes[].id`                                       | Surface 내부의 UI 흐름 단위. Slot 세트를 보유하며 트리 2단계 노드로 노출된다.                        |
| Slot (L3)          | Slot, Section Slot         | `Slot/header-primary` 그룹       | `routeStore.routes[].slots[].id`, `slotManager`                | 컴포넌트가 배치되는 자리. 허용 섹션/컴포넌트 목록과 diff 보고 대상이다.                              |
| Component (L4)     | Component Instance         | `Comp:Card#primary`              | DSL `componentName`, ResultLog `slotReport.createdNodeNames[]` | Slot에 실제 배치되는 빌딩 블록. 컴포넌트 레지스트리를 따라야 한다.                                   |
| Section            | Section                    | `SECTION:timeline-summary`       | `sectionStore.availableSections[]`                             | Slot에 매핑되는 콘텐츠 묶음. Schema Preview·Execution payload와 직접 연결된다.                       |
| Guardrail          | Guardrail 체크             | `GUARDRAIL` 주석 또는 배지       | `guardrailStore`                                               | Dry-run 검증 결과. 생성/경고/오류 메트릭과 추세를 기록한다.                                          |
| Execution Controls | Execution Panel            | `Execution` 패널                 | `executionStore`, `TargetSelect`                               | Dry-run/Apply 버튼과 대상 페이지 설정을 담당한다.                                                    |
| QuickActions       | Quick Actions              | `Quick Actions` 버튼 그룹        | `quick-actions` 서비스                                         | 샘플 로드, Hello 프레임, 체크포인트 초안 등 단축 기능 트리거.                                        |
| Preview Controls   | Preview 패널               | `Preview 상태`, `Before/After`   | `previewStore`                                                 | 프레임 포커스, 섹션 하이라이트, Before/After 슬라이더를 제공한다.                                    |
| Result Log         | Result Log                 | `Result Log` 패널                | `logStore`                                                     | 실행 기록과 Slot diff, Guardrail 메타를 보관한다. 로그 히스토리 20개 유지.                           |
| Checkpoint Draft   | Checkpoint Draft           | 체크포인트 버튼                  | `checkpoint` 서비스                                            | Dry-run/Apply 결과를 Markdown 초안으로 내보내고 체크포인트 디렉터리에 저장한다.                      |
| Observability Meta | Observability              | 프리뷰 요약 주석                 | `guardrailStore.history`, `logStore`, 체크포인트               | 실행 intent, payload 해시, 선택 스냅샷을 공통 메타로 기록한다.                                       |
| Token Registry     | Token Registry             | Variables/Styles 패널            | `tokenRegistry`                                                | Variables → Styles → Raw 순으로 토큰을 해석한다.                                                     |
| Undo/Redo 히스토리 | History                    | 로그 패널 버튼                   | `logStore.undo()`, `logStore.redo()`                           | 실행 히스토리를 롤백/재적용한다. 히스토리 초과 시 가장 오래된 항목을 체크포인트에 스냅샷으로 남긴다. |

> 용어가 추가되거나 변경되면 본 표를 업데이트한 뒤 관련 문서와 Guardrail 검증을 갱신한다.
