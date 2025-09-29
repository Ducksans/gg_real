---
file: admin/docs/checkpoints/2025-09-29-figma-plugin.md
title: Figma 플러그인 자동화 체크포인트 (2025-09-29)
owner: duksan
created: 2025-09-29 06:40 UTC / 2025-09-29 15:40 KST
updated: 2025-09-29 06:49 UTC / 2025-09-29 15:49 KST
status: released
tags: [checkpoint, figma, automation]
schemaVersion: 1
summary: Figma 자동화 플러그인 초안이 페이지 선택 기능과 JSON 기반 레이아웃 생성을 지원하는 상태로 완성되어 다음 단계 확장을 준비함.
linkedPlans:
  - admin/plan/figmapluginmake.md
  - admin/plan/devworkspace.md
---

## 현재 성과

- `figma-hello-plugin`이 TypeScript 구조로 정비되어 `npm run build` / `npm run typecheck`가 안정적으로 동작한다.
- 플러그인 UI에 JSON 입력, 샘플 로드, Hello 프레임 생성, 대상 페이지 선택 드롭다운을 제공.
- JSON 실행 시 선택한 Figma 페이지에 프레임과 하위 요소가 즉시 생성되며, `replace` 모드를 통해 기존 프레임 대체 가능.
- 토큰 레지스트리로 기본 색상/타이포/라운드 매핑을 적용하고, 샘플 스키마(`samples/glossary.ts`)를 통해 2분할 레이아웃을 생성.
- Windows VM + 공유 폴더 환경에서 manifest 재로딩 → 테스트까지 일련의 개발 흐름이 검증됨.

## 남은 과제

1. 컴포넌트 인스턴스, 이미지/벡터 타입 등 스키마 확장 및 토큰 테이블 자동 동기화.
2. 실행 로그 고도화(유효성 검증, undo/redo 테스트, 사용자 안내 메시지).
3. Codex ↔ 플러그인 연동 프로토콜 설계 및 Dev Workspace에서의 자동화 연동 문서화.
4. 실제 디자인 토큰(Figma Variables/Styles)과의 연결 자동화 및 에러 핸들링 강화.

## 다음 액션 제안

- 토큰 JSON 구조 및 컴포넌트 매핑 표준화 → `tokenRegistry` 확장.
- 복잡한 레이아웃 샘플(탭, 카드, 테이블 등) 추가로 파서/생성 로직 검증.
- Dev Workspace 문서/시각화 단계에 플러그인 활용 가이드 추가.
- 중장기적으로는 REST API 또는 Codex 명령과의 통합을 위한 통신 레이어 설계.

## 참고 커밋

- 58f5d07: 노드 생성 방식 개편(appendNodesFromSchema)으로 페이지 대상 안정화.
- 4cbbeb2: UI에 대상 페이지 선택 기능 추가.
- 59c7b73~4cbbeb2: 초기 TypeScript 보일러플레이트 도입 및 샘플 스키마 연동.

현재 시점에서 플러그인은 “페이지 선택 + JSON 자동 배치” 기반의 기본 자동화 요구를 충족하며, 이후 단계(컴포넌트 확대, 토큰 싱크, Codex 연동) 작업을 위한 준비가 완료되었습니다.
