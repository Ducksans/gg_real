---
file: admin/plan/figmapluginmake.md
title: Figma Plugin 자동화 구축 계획
owner: duksan
created: 2025-09-27 06:03 UTC / 2025-09-27 15:03 KST
updated: 2025-09-29 07:44 UTC / 2025-09-29 16:44 KST
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

# 5. 고도화 핵심 방향

## 5.1 이름-계약(Name Contract)

- 디자인과 코드가 공유하는 “공식 컴포넌트 레지스트리”를 정의해 Card, Table, Tabs 등 재사용 단위를 고정한다.
- Figma 노드 명명 규칙을 `COMP:<ComponentName>#<InstanceKey>` 형태로 통일하고, JSON 스키마에도 동일한 `componentName`을 명시한다.
- 실행 전 검증에서 레지스트리에 없는 이름을 감지해 실패 처리하면, Dev Workspace 단계에서 잘못된 명령이 빠르게 차단된다.

## 5.2 레이아웃 DSL

- 절대좌표 대신 `stack`, `grid`, `cluster`, `slot` 등 의도 기반 규칙을 JSON으로 기술해 복잡한 레이아웃을 간결하게 표현한다.
- breakpoints(sm/md/lg)별로 direction, span, gap 등을 오버라이드할 수 있도록 하고, 슬롯 기반(예: `slots.header`) 구조로 컴포넌트 내부 영역을 확장한다.
- DSL 사양은 Dev Workspace의 와이어프레임/승인 흐름과 동기화해, 디자인→코드 분기 없이 동일한 언어를 사용한다.

## 5.3 증분 갱신 프로토콜

- 모든 노드에 `idempotentKey`를 부여하고 `op: "add"|"update"|"remove"` 단위 패치를 지원해 전체 재생성 없이 부분 수정이 가능하도록 한다.
- 드라이런 결과와 변경 요약을 먼저 노출한 뒤 승인 시 실제 적용하도록 UX를 정의한다.
- 자동 생성물은 `ROOT_AUTO_WF/<timestamp>` 프레임 아래 배치해 Undo/롤백과 감사 로그를 단순화한다.

## 5.4 토큰 거버넌스

- 색상/타이포/간격은 Variables를 1순위, Styles를 2순위, Raw 값을 최후 fallback으로 삼아 일관성을 유지한다.
- 다크/라이트 모드 전환은 변수 모드 토글만으로 처리하여 하드코딩을 방지한다.
- 토큰 테이블은 자동 동기화 스크립트와 함께 Dev Workspace에서 확인할 수 있도록 문서화한다.

## 5.5 관찰성·승인·버저닝

- 실행 로그는 요약(사용자 확인용)과 상세(개발자 디버깅용) 채널로 구분하고, 실패·경고·정보 레벨을 나눈다.
- 각 노드의 `pluginData`에 `schemaVersion`, `specHash`, `createdBy`, `timestamp`, `devResource` 링크를 기록해 추적성을 확보한다.
- schemaVersion 정책(메이저/마이너, 마이그레이션 가이드)을 명문화하고, Dev Workspace 승인 플로우(드라이런 → 요약 → 적용)와 연결한다.

## 5.6 접근성·성능·배포 고려

- 스키마 단계에서 `a11yRole`, `ariaLabel`, `description` 등을 필수 필드로 받아 접근성 메타데이터를 확보한다.
- 대형 화면 생성 시 배치 처리, 프리패브 템플릿, 지연 스타일 적용 등 성능 전략을 사전에 정의한다.
- 배포는 Private → 조직 → 커뮤니티 순으로 확대하며, 변경 로그와 롤백 전략을 체크포인트와 동기화한다.

# 6. TODO

## 6.1 완료됨

- [x] JSON 스키마 초안 작성 (레이아웃/스타일/컴포넌트) 후 devworkspace와 연동.
- [x] 플러그인 boilerplate 생성 (manifest, UI, controller).
- [x] 토큰 매핑 전략 설계: Figma 스타일 네이밍 규칙 정리.
- [x] 샘플 JSON → Figma 생성 PoC (단순 3단 레이아웃).

## 6.2 남은 작업

- [ ] [P1] 컴포넌트 레지스트리와 명명 규칙을 문서화하고 플러그인 검증 로직에 연동한다. (참고: `admin/references/figmaplugin/automation-plugins-research.md`, `admin/references/figmaplugin/figma-plugin-api.md`)
- [ ] [P1] 레이아웃 DSL 초안을 작성해 스택/그리드/슬롯 규칙과 반응형 오버라이드 문법을 정의한다. (참고: `admin/references/figmaplugin/figma-plugin-samples.md`)
- [ ] [P1] 증분 갱신 프로토콜(dry-run, op 세트, ROOT 프레임 정책)을 확정하고 Undo/Redo 테스트 절차를 마련한다. (참고: `admin/references/figmaplugin/figma-plugin-api.md`)
- [ ] [P1] 오류/검증 로직을 강화해 미지원 타입·토큰 누락을 사전에 차단하고 사용자용 메시지를 개선한다. (참고: `admin/references/figmaplugin/figma-plugin-ui-guide.md`)
- [ ] [P2] Variables/Styles 우선 순서를 구현하고 다크/라이트 토큰 자동 전환 규칙을 적용한다. (참고: `admin/references/figmaplugin/design-token-tools.md`)
- [ ] [P2] 관찰성 메타데이터(로그 채널, pluginData, Dev Resources 링크) 스펙을 확정한다. (참고: `admin/references/figmaplugin/figma-plugin-api.md`, `admin/references/figmaplugin/figma-plugin-ui-guide.md`)
- [ ] [P2] Codex ↔ 플러그인 인터페이스(상태 질의, 패치 계약, 승인 플로)를 문서화하고 샌드박스를 구축한다. (참고: `admin/references/figmaplugin/figma-manifest-v2.md`, `admin/references/figmaplugin/figma-developer-api.md`)
- [ ] [P2] 드라이런 → 변경 요약 → 승인 적용 UX를 Dev Workspace와 맞물리도록 설계한다. (참고: `admin/references/figmaplugin/figma-plugin-ui-guide.md`)
- [ ] [P3] 접근성 필드(a11yRole, ariaLabel 등)와 스키마 검증 규칙을 추가한다. (참고: `admin/references/figmaplugin/figma-plugin-api.md`)
- [ ] [P3] 성능 대응 전략(배치 처리, 프리패브, 지연 스타일 적용)을 실험하고 기준치를 정의한다. (참고: `admin/references/figmaplugin/figma-plugin-samples.md`, `admin/references/figmaplugin/automation-plugins-research.md`)
- [ ] [P3] 배포/공유 방식 결정(Private → Team → Community) 및 변경 로그·롤백 정책을 확정한다. (참고: `admin/references/figmaplugin/figma-manifest-v2.md`, `admin/references/figmaplugin/figma-developer-api.md`)

# 7. 참고 자료 & API 레퍼런스

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

## 로컬 참고 자료

- `admin/references/figmaplugin/README.md`
- `admin/references/figmaplugin/figma-plugin-api.md`
- `admin/references/figmaplugin/figma-plugin-samples.md`
- `admin/references/figmaplugin/figma-manifest-v2.md`
- `admin/references/figmaplugin/figma-plugin-ui-guide.md`
- `admin/references/figmaplugin/figma-developer-api.md`
- `admin/references/figmaplugin/automation-plugins-research.md`
- `admin/references/figmaplugin/design-token-tools.md`

# 8. 진행 현황 및 다음 액션

- 2025-09-29: VirtualBox 기반 Windows 환경 구축, 공유 폴더 연동 완료.
- `figma-hello-plugin` 초기 버전에서 `Hello World` 프레임 생성 PoC 성공.
- TypeScript 기반 플러그인 보일러플레이트 구성(`src/`, `dist/`, `package.json`, `README`).
- 샘플 JSON(`samples/glossary.ts`)을 UI와 연동하여 2분할 레이아웃 생성 기능 구현.
- 토큰 레지스트리(`tokenRegistry`)로 기본 색상/타이포/라운드 매핑 제공.
- 대상 페이지 선택 드롭다운 및 현재 페이지 기본값 연동, 실행 시 즉시 append 방식으로 안정화.
- 다음 작업
  1. 컴포넌트 레지스트리·명명 규칙·DSL 초안을 정리하고 Dev Workspace 레퍼런스에 반영.
  2. 증분 갱신 프로토콜(dry-run, 패치 요약, ROOT 프레임)과 로그/Undo 테스트 시나리오를 확정.
  3. Codex ↔ 플러그인 인터페이스 문서와 샌드박스를 정비해 상태 질의·승인 플로 시연.

# 9. 리스크 및 대응

- **스키마 변경**: UI 복잡도가 높아지면 JSON 구조가 자주 바뀔 수 있음 → 버전 필드와 마이그레이션 로직 준비.
- **디자인 토큰 불일치**: Figma 스타일 ID가 변경되면 매핑 실패 → 토큰 등록 UI와 자동 업데이트 기능 고려.
- **이름 계약 미준수**: 레지스트리에 없는 컴포넌트가 요청되면 디자인·코드 불일치 발생 → 검증 단계에서 즉시 실패 처리.
- **DSL 복잡성**: 규칙이 늘어날수록 사용자 이해가 어려울 수 있음 → 예제와 린트 규칙으로 학습 비용 감소.
- **성능**: 큰 레이아웃을 한 번에 생성할 때 지연 발생 가능 → 배치 단위 작업, 프리패브, 진행률 표시.
- **학습 곡선**: 팀이 스키마를 이해해야 함 → 예제와 문서, 테스트 JSON 제공.
- **승인/관찰성 누락**: 드라이런 또는 로그 축적을 건너뛰면 감사 추적이 어려움 → Dev Workspace 승인 플로를 필수 단계로 강제.

# 10. 기록 및 후속 작업

- PoC 결과와 학습 내용은 `admin/docs/` 아래에 별도 문서화.
- Dev Workspace 계획(`admin/plan/devworkspace.md`)과 연동하여 시각화 자동화 단계 업데이트.
- 플러그인 저장소/코드 구조 준비 후 Git 연동.
