---
file: admin/references/figmaplugin/figma-plugin-api.md
title: Figma Plugin API 레퍼런스 노트
owner: duksan
created: 2025-09-29 07:36 UTC / 2025-09-29 16:36 KST
updated: 2025-09-29 07:44 UTC / 2025-09-29 16:44 KST
status: draft
tags: [reference, figma, plugin, api]
schemaVersion: 1
description: Figma Plugin API 공식 문서를 빠르게 훑기 위한 요약 및 체크 포인트
---

## 원본 링크

- <https://www.figma.com/plugin-docs/api/> (Figma 공식 Plugin API Reference)

## 집중해서 볼 섹션

- 실행 컨텍스트: `figma.currentPage`, `figma.getNodeById`, 비동기 메서드 사용 시 주의 사항
- 노드 생성: `createFrame`, `createRectangle`, `createText`, `createComponent`, `createComponentSet`
- 오토레이아웃: `layoutMode`, `primaryAxisSizingMode`, `counterAxisAlignItems`, `padding`
- 변수·스타일: `setProperties`, `fillStyleId`, `strokeStyleId`, `effectStyleId`, `boundVariables`
- 히스토리/Undo: `figma.currentPage.appendChild`, `figma.group`, `figma.commitUndo` 관련 패턴
- 통신: UI ↔ 플러그인 간 `figma.ui.postMessage`, `figma.on('run')`, `figma.on('close')`
- 권한/연산 제한: 플러그인 런타임 제한, selection 변경 이벤트 처리 규칙

## 활용 메모

- 증분 갱신 설계 시 `getNodeById`와 `findOne` 조합으로 대상 노드를 정확히 찾을 수 있는지 점검한다.
- Undo/Redo 안정화를 위해 자동 생성물은 중간에 `figma.group`을 사용하기보다 루트 프레임에 직접 부착하는 편이 안전하다.
- 토큰 매핑은 `boundVariables` 지원 여부를 우선 확인하고, Figma Variables가 필수인지 파악한다.

## 추가 TODO 연계

- [P1] 증분 갱신 프로토콜을 정의할 때, `figma.importComponentByKeyAsync`와 같은 비동기 API를 사용할 가능성을 검토한다.
- [P2] 관찰성 메타데이터는 `setSharedPluginData` 사용을 염두에 두고 스키마를 설계한다.
