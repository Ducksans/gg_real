---
file: admin/references/figmaplugin/figma-plugin-samples.md
title: Figma Plugin 샘플 살펴보기 노트
owner: duksan
created: 2025-09-29 07:36 UTC / 2025-09-29 16:36 KST
updated: 2025-09-29 18:41 UTC / 2025-09-30 03:41 KST
status: draft
tags: [reference, figma, samples]
schemaVersion: 1
description: GitHub의 Figma 플러그인 샘플을 분석할 때 확인할 포인트와 링크 정리
---

## 원본 링크

- <https://www.figma.com/plugin-docs/plugin-samples/>
- GitHub 저장소: <https://github.com/figma/plugin-samples>

## 중점 확인 항목

- `widgets/code.ts`, `create-node` 등 노드 생성 사례에서 이벤트 핸들링과 Undo 지원 방식 비교
- `autolayout/` 샘플로 레이아웃 DSL 설계에 필요한 속성 사용 패턴 확인
- `variables/` 샘플로 Variables 읽기/쓰기 흐름 파악
- `manifest-v3/` 샘플로 최신 manifest 필드 구조와 권한 설정 참고

## 관찰한 패턴

- `create-node` 샘플은 새 노드 생성 후 즉시 `pluginData`를 저장해 재실행 시 동일 노드를 찾을 수 있도록 한다.
- `autolayout` 샘플은 `primaryAxisSizingMode = "AUTO"`, `counterAxisAlignItems = "CENTER"` 등을 통해 DSL에서 사용할 수 있는 속성 셋을 보여준다.
- `variables` 샘플에서는 `await figma.variables.getVariableByIdAsync` 이후 `setBoundVariable`을 호출하는 순서를 지켜야 오류가 발생하지 않는다.
- 대부분의 샘플이 Undo 그룹화를 위해 속성 설정을 먼저 수행한 뒤 마지막에 `appendChild`를 호출한다.

## 활용 메모

- 레이아웃 DSL 초안 작성 전에 `autolayout` 샘플을 직접 실행해 gap, padding, resizing이 어떻게 적용되는지 확인한다.
- 증분 갱신 테스트는 `component-duplicates` 샘플을 응용해 동일 키 노드를 갱신하는 실험으로 시작할 수 있다.
- UI 통신 구조(`ui.html` + `code.ts`)를 비교해 Dev Workspace와의 승인 UI 연결 방식을 구상한다.

## 추가 TODO 연계

- [P1] 레이아웃 DSL 설계 시 필요한 속성 리스트를 샘플에서 추출해 체크리스트화한다.
- [P2] Variables 우선 순위 구현 전 `variables` 샘플의 에러 처리 패턴을 리뷰한다.
