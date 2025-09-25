---
file: admin/docs/ui-graph-redesign.md
title: 그래프 뷰 리디자인 메모
owner: duksan
created: 2025-09-24 08:50 UTC / 2025-09-24 17:50 KST
updated: 2025-09-25 01:54 UTC / 2025-09-25 10:54 KST
status: draft
tags: [docs, ui, graph]
schemaVersion: 1
description: 관리자 그래프 화면 리디자인을 위한 와이어프레임 요구 사항과 컴포넌트 설계 메모
code_refs:
  [
    'apps/web/src/app/admin/graph/page.tsx',
    'apps/web/src/components/graph/DependencyGraph.tsx',
    'basesettings.md',
  ]
---

## 레이아웃 목표

- 1920×1080 기준 그래프 영역을 가로 70~75% 차지하도록 확대한다.
- 우측 패널은 접기/펼치기가 가능하도록 설계하고, 범례·엣지 설명·노드 상세 정보를 탭으로 분리한다.
- 상단 툴바는 전체 화면 토글, 확대/축소, 그래프 PNG 내보내기 버튼을 포함한다.

## 와이어프레임 요약

1. **상단 툴바**
   - 왼쪽: 제목/설명, `그래프`, `PNG 내보내기` 버튼.
   - 오른쪽: `전체 화면`, `Fit View`, `Reset` 버튼.
2. **콘텐츠 영역**
   - 좌측(그래프 캔버스): React Flow 캔버스, 최소 높이 620px.
   - 우측(보조 패널): 탭 구성 → `세부 정보`, `상태 범례`, `엣지 타입`, `도움말`.
   - 패널은 `lg` 이상에서 폭 25%, `md` 이하에서는 drawer/모달로 전환.
3. **하단 정보 바**
   - 최근 저장 시간, 소스 데이터 경로, 키보드 단축키 안내를 배치한다.

## 컴포넌트 분할 계획

- `GraphLayoutShell`: 툴바/캔버스/패널 레이아웃 담당.
- `GraphToolbar`: 전체 화면 토글, PNG 저장, fit view 버튼 제공.
- `GraphDetailsPanel`: 탭 UI. React Flow 선택 노드와 범례 데이터를 props로 전달.
- `GraphFullScreenProvider`: 전체 화면 상태를 context로 관리.
- `GraphLegendAccordion`: 범례/엣지 설명을 accordion 형태로 보여주는 컴포넌트.

### 작업 분해

- [ ] `GraphLayoutShell` 초안 작성 (`apps/web/src/components/graph/LayoutShell.tsx` 예정).
- [ ] `GraphToolbar`에 전체 화면 토글 + 단축키 헬퍼(`useKeyboardShortcut`) 추가.
- [ ] `GraphDetailsPanel`을 탭 컴포넌트로 구현하고, 노드 상세/범례/엣지/도움말 탭 분리.
- [ ] `GraphFullScreenProvider`로 `DependencyGraph`와 레이아웃 간 상태 공유.
- [ ] React Flow `Controls` 커스터마이징 → 확대/축소/리셋 버튼 툴바로 이동.
- [ ] 반응형 대응: `lg` 이상은 패널 고정, 그 이하에서는 drawer 토글 버튼 제공.

## 인터랙션 시나리오

1. 사용자가 노드를 클릭하면 보조 패널 `세부 정보` 탭이 자동 활성화된다.
2. `전체 화면`을 누르면 패널이 자동으로 숨겨지고, ESC 키로 복귀한다.
3. `Fit View` 버튼은 현재 확대 비율을 초기화하고, `Reset`은 위치/줌/필터를 모두 초기 상태로 되돌린다.

## TODO

- [ ] Figma 와이어프레임 링크 추가.
- [ ] 패널 가시성 상태를 URL 파라미터나 localStorage로 동기화 여부 결정.
- [ ] 단축키(`f`, `?`, `esc`) 문서화 및 툴팁 처리.
- [ ] 모바일/태블릿 레이아웃 mock 작성.
- [ ] `GraphLegendAccordion` API 스펙 정의.
- [ ] React Flow `fitViewOptions` 및 `onMoveEnd`를 사용한 상태 동기화 전략 문서화.
