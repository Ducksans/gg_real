---
file: admin/references/figmaplugin/automation-plugins-research.md
title: 자동화 플러그인 벤치마크 노트
owner: duksan
created: 2025-09-29 07:36 UTC / 2025-09-29 16:36 KST
updated: 2025-09-29 18:41 UTC / 2025-09-30 03:41 KST
status: draft
tags: [reference, research, automation]
schemaVersion: 1
description: Automator, Locofy 등 자동화 플러그인의 동작을 분석해 고도화 아이디어를 도출하기 위한 가이드
---

## 조사 대상

- Automator (Figma Community): No-code 액션 조합, 조건부 실행, 동적 파라미터
- Locofy (Plugin & External Service): 컴포넌트 네이밍, 코드 Export 흐름
- Figma Tokens/Variables 관련 커뮤니티 플러그인

## 조사 요약

- **Automator**
  - 액션을 “Step” 단위로 쌓고 실행 전 시뮬레이션을 제공한다. 각 Step에는 `target`, `operation`, `parameters`가 명시되며, 실행 결과는 로그 패널에 Success/Warning/Error로 구분된다.
  - 기존 노드에 `AUTOMATOR_ID`와 같은 내부 키를 부여해 재실행 시 동일 노드를 갱신한다. 이 키는 레이어 이름과 분리돼 있어 이름 변경에도 안정적이다.
  - Auto Layout 관련 Step은 `direction`, `spacing`, `padding`을 매개변수로 받고 breakpoints 개념은 없지만 “Apply constraint preset” 기능으로 모바일/데스크톱 변형을 미리 정의한다.

- **Locofy**
  - 컴포넌트 이름 규칙을 `Section/Hero`, `Component/Button` 형태로 계층적으로 강제하고, Export 시 React/Vue 컴포넌트 이름을 동일하게 사용한다.
  - Figma 컴포넌트와 코드 컴포넌트 사이의 프롭 매핑을 UI에서 선언하고, Export 전에 JSON 설정파일(`locofy.config.json`)에 저장한다.
  - 레이아웃은 Auto Layout 속성과 Constraints를 그대로 읽어 CSS Flex/Grid로 변환한다. 레이아웃 DSL은 제공하지 않지만, breakpoint마다 스타일을 분기할 수 있는 Override 패널이 있다.

- **Figma Tokens / Variables Plugins**
  - 토큰 JSON을 컬렉션+모드 구조로 관리하며, 각 토큰에 `tokenPath`와 `figmaStyleId`를 매핑한다.
  - 변경 사항은 `Changes` 패널에서 Diff 형태로 보여주고, 적용 시 기존 노드의 `pluginData`를 갱신한다. Undo/Redo는 한 번의 Push마다 묶여 있어 롤백이 명확하다.

## 2025-09-29 추가 조사

- **Figma Plugin Samples** ([github.com/figma/plugin-samples](https://github.com/figma/plugin-samples))
  - 샘플 전반이 TypeScript에 기반하며 UI가 있는 경우 `ui.html`과 `code.ts`로 분리되어 있다. Dry-run/승인 패널을 설계할 때도 동일한 구조(메인 스레드 ↔ UI 메시지)로 유지하는 것이 정석.
  - README에서 권장하는 UI 스타일 가이드(Plugin DS, Create Figma Plugin UI)를 적용하면 Figma 표준 UI와 시각적으로 일치하는 버튼, 섹션, 디스크로저를 손쉽게 구현 가능. 좌측 트리/우측 로그 패널도 이 컴포넌트를 사용하면 키보드/스크린리더 대응이 자연스럽게 따라온다.
  - `variables-import-export`, `styles-to-variables` 샘플은 Variables/Styles를 대량으로 읽고 쓰는 흐름(비동기 + 에러 처리)을 잘 보여주므로, 현재 슬롯 기반 실행 파이프라인에서도 참고 필요.

- **Figma Plugin DS** ([github.com/thomas-lowry/figma-plugin-ds](https://github.com/thomas-lowry/figma-plugin-ds))
  - Disclosure(아코디언), Select Menu, Section Header 등 플러그인 표준 UI 컴포넌트 구현이 모두 포함되어 있으며 JS 초기화 코드를 제공한다. Surface → Route → Slot을 Disclosure 컴포넌트로 표현하면 현재 트리보다 훨씬 간결한 계층 UI를 만들 수 있다.
  - 버튼/아이콘/온보딩 팁 등 다양한 패턴이 준비되어 있어 Dry-run 로그, 승인/취소, redo/undo 버튼을 Figma 스타일로 제공 가능. 체크박스/라디오도 포함되어 있어 슬롯별 전체 선택 UI 구현에 적합하다.
  - Roadmap에 “Improved keyboard nav”가 명시되어 있으므로 접근성 측면에서 최신 버전의 keyboard navigation 지원 여부를 확인하고 반영해야 한다.

## 아이디어로 전환할 포인트

1. `AUTOMATOR_ID` 패턴을 참고해 `idempotentKey`를 레이어 이름과 분리된 메타 데이터(예: `pluginData.AUTO_ID`)로 관리한다.
2. Locofy의 계층형 네이밍을 본떠 컴포넌트 레지스트리를 `Section/Card/List` 등 계층으로 나누고, JSON 스키마의 `componentName`과 1:1 매핑한다.
3. Tokens Plugin처럼 변경 전/후 Diff를 요약해 보여주는 “패치 요약” 패널을 설계하면 승인 단계의 신뢰도가 높아진다.

## 살펴볼 항목 체크리스트

1. 명령 구성 방식: 사용자가 액션을 쌓아 실행하는지, JSON/스크립트 기반인지
2. 이름 규칙: 디자인 컴포넌트와 코드 아웃풋의 이름을 어떻게 동기화하는지
3. 레이아웃 추상화: Auto Layout, Constraints, Grid를 어떤 DSL로 표현하는지
4. 증분 업데이트: 기존 요소를 덮어쓰는지, 새 프레임을 만드는지, 차이 보고를 제공하는지
5. 로그/피드백: 실행 후 사용자가 어떤 형태의 보고를 받는지 (모달, 패널, 다운로드 링크 등)
6. 배포/권한: Private vs Public, Update 정책, 팀 공유 절차

## 조사 방법 제안

- 플러그인을 직접 설치해 작은 예제를 실행하고, 실행 로그와 생성물 구조를 캡처한다.
- JSON/설정 파일을 추출할 수 있다면 `admin/references/figmaplugin/snapshots/`에 저장하고 메타데이터를 남긴다.
- 부족한 정보는 커뮤니티 포럼이나 블로그 글을 참고하되, 핵심 구조만 요약해 기록한다.

## 추가 TODO 연계

- [P1] 컴포넌트 레지스트리 설계 전에 Automator/Locofy의 네이밍 규칙을 비교해 베스트 프랙티스를 도출한다.
- [P1] 레이아웃 DSL 작성 시 Automator 액션 구조를 참고해 사용자 친화성을 확보한다.
- [P2] 관찰성 설계 시 다른 플러그인의 로그/Undo UX를 시연하며 참고 스크린샷을 수집한다.
