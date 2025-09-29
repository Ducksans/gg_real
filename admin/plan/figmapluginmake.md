---
file: admin/plan/figmapluginmake.md
title: Figma Plugin 자동화 구축 계획
owner: duksan
created: 2025-09-27 06:03 UTC / 2025-09-27 15:03 KST
updated: 2025-09-29 06:49 UTC / 2025-09-29 15:49 KST
status: draft
tags: [plan, figma, automation, plugin]
schemaVersion: 1
description: Codex 명령을 JSON으로 전달해 Figma에서 UI를 자동 생성·수정하는 플러그인 설계 및 실행 계획
code_refs: []
---

# 1. 목표

- Codex가 생성한 레이아웃 명령(JSON)을 받아 Figma 내부에서 프레임, 컴포넌트, 텍스트 등을 자동으로 배치/스타일링하는 전용 플러그인을 구현한다.
- 문서 → 시각화 → 코딩 흐름에서 “시각화” 단계를 플러그인으로 자동화하여, 개발 전에 정밀한 디자인 기준을 빠르게 확보한다.

# 2. 요구 사항 정리

| 범주      | 요구 내용                                                                        |
| --------- | -------------------------------------------------------------------------------- |
| 입력 포맷 | Codex가 전달하는 JSON 스키마(레이아웃 트리, 스타일 토큰, 컴포넌트 ID)            |
| 출력      | Figma 내 선택한 페이지/프레임에 UI 요소 생성 및 정렬                             |
| 스타일    | 프로젝트 디자인 토큰(색상, 타이포, 공간 단위)을 적용, 다크/라이트 모드 변수 대응 |
| 상호작용  | 반복 실행 시 기존 요소를 업데이트하거나 새 프레임으로 복제                       |
| 오류 처리 | 유효하지 않은 파라미터 대비 검증/로그 출력, undo 지원                            |

# 3. 기술 조사

- **Figma Plugin API**: `figma.createFrame`, `createAutoLayout`, `currentPage.selection`, `notify`, `clientStorage` 등 사용.
- **JSON 스키마 설계**
  - `frame` / `stack` / `text` / `componentInstance` 등 타입 지정.
  - 속성: `size`, `layoutMode`, `spacing`, `fills`, `strokes`, `cornerRadius`, `textStyle`.
  - 네임드 토큰: `color.primary`, `space.md`, `font.heading` 등으로 매핑.
- **디자인 토큰 소스**
  - Figma 스타일(ID) 또는 외부 JSON을 플러그인에 로드.
- **UI 패널**
  - 플러그인 UI에서 JSON 붙여넣기 / 파일 업로드 / Codex API 호출 버튼 제공.
- **자동화 레퍼런스**
  - Automator 플러그인의 액션 포맷 분석
  - 커뮤니티 플러그인 (e.g. Design to Code, Automator) 내부 동작 리서치

# 4. 아키텍처 & 흐름 초안

1. 사용자가 플러그인 UI에 JSON을 붙여넣거나 Codex에게 요청 → Codex가 JSON 응답.
2. 플러그인이 JSON을 파싱해 레이아웃 트리를 DFS로 순회.
3. 각 노드 타입에 맞는 Figma API 호출로 요소 생성.
4. 스타일 토큰을 실제 Figma 스타일 ID 혹은 값으로 매핑.
5. 성공/오류 메시지를 플러그인 UI에 표시, 작업 후 선택 영역으로 포커스 이동.

# 5. TODO

- [x] JSON 스키마 초안 작성 (레이아웃/스타일/컴포넌트) 후 devworkspace와 연동.
- [x] 플러그인 boilerplate 생성 (manifest, UI, controller).
- [x] 토큰 매핑 전략 설계: Figma 스타일 네이밍 규칙 정리.
- [x] 샘플 JSON → Figma 생성 PoC (단순 3단 레이아웃).
- [ ] 오류/검증 로직 추가, Undo/Redo 동작 테스트.
- [ ] Codex ↔ 플러그인 연동 인터페이스 문서화 (명령 프로토콜).
- [ ] 배포/공유 방식 결정(사내 전용 or 커뮤니티).

# 6. 참고 자료 & API 레퍼런스

- 공식 문서
  - Figma Plugin API Reference: <https://www.figma.com/plugin-docs/api/>
  - Figma Widget/Plugin Samples: <https://www.figma.com/plugin-docs/plugin-samples/>
  - REST API Docs (파일/버전 조회 등 확장 필요 시): <https://www.figma.com/developers/api>
- 개발 도구
  - Plugin manifest v2 규격: <https://www.figma.com/plugin-docs/manifest/>
  - UI 러너(Webview) 가이드: <https://www.figma.com/plugin-docs/how-plugins-run/>
- 조사 예정 항목
  - Automator/Locofy 등 자동화 플러그인 워크플로 분석
  - Design Token 관리 도구(Variables, Styles) 활용 사례 정리

# 7. 진행 현황 및 다음 액션

- 2025-09-29: VirtualBox 기반 Windows 환경 구축, 공유 폴더 연동 완료.
- `figma-hello-plugin` 초기 버전에서 `Hello World` 프레임 생성 PoC 성공.
- TypeScript 기반 플러그인 보일러플레이트 구성(`src/`, `dist/`, `package.json`, `README`).
- 샘플 JSON(`samples/glossary.ts`)을 UI와 연동하여 2분할 레이아웃 생성 기능 구현.
- 토큰 레지스트리(`tokenRegistry`)로 기본 색상/타이포/라운드 매핑 제공.
- 대상 페이지 선택 드롭다운 및 현재 페이지 기본값 연동, 실행 시 즉시 append 방식으로 안정화.
- 다음 작업
  1. 컴포넌트/이미지 타입 지원 및 토큰 테이블 자동 동기화.
  2. 실행 로그/검증 메시지 강화, undo 테스트 절차 수립.
  3. Codex ↔ 플러그인 명령 프로토콜 문서화 및 샌드박스 구축.

# 8. 리스크 및 대응

- **스키마 변경**: UI 복잡도가 높아지면 JSON 구조가 자주 바뀔 수 있음 → 버전 필드와 마이그레이션 로직 준비.
- **디자인 토큰 불일치**: Figma 스타일 ID가 변경되면 매핑 실패 → 토큰 등록 UI와 자동 업데이트 기능 고려.
- **성능**: 큰 레이아웃을 한 번에 생성할 때 지연 발생 가능 → 배치 단위 작업, 프로그레스 표시.
- **학습 곡선**: 팀이 스키마를 이해해야 함 → 예제와 문서, 테스트 JSON 제공.

# 9. 기록 및 후속 작업

- PoC 결과와 학습 내용은 `admin/docs/` 아래에 별도 문서화.
- Dev Workspace 계획(`admin/plan/devworkspace.md`)과 연동하여 시각화 자동화 단계 업데이트.
- 플러그인 저장소/코드 구조 준비 후 Git 연동.
