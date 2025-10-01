---
file: admin/plan/figmapluginmake.md
title: Figma Plugin 설계 및 개념 허브
owner: duksan
created: 2025-09-27 06:03 UTC / 2025-09-27 15:03 KST
updated: 2025-10-01 16:11 UTC / 2025-10-02 01:11 KST
status: in_progress
tags: [plan, figma, automation, plugin]
schemaVersion: 1
description: 플러그인 비전과 설계 원칙, 기능 수용 기준을 정의하는 기준 문서
doc_refs: ['admin/plan/figmaplugin-terminology.md', 'admin/plan/figmaplugin-roadmap.md']
code_refs:
  [
    'figma-hello-plugin/scripts/manifest/builder.ts',
    'figma-hello-plugin/scripts/manifest/loader.ts',
    'figma-hello-plugin/scripts/manifest/normalizer.ts',
    'figma-hello-plugin/scripts/manifest/validator.ts',
    'figma-hello-plugin/scripts/build-ui.ts',
    'figma-hello-plugin/src/runtime/executor/index.ts',
    'figma-hello-plugin/src/ui/components/ExecutionControls.tsx',
    'figma-hello-plugin/src/ui/components/RouteTree/index.ts',
    'figma-hello-plugin/src/ui/services/quick-actions.ts',
    'figma-hello-plugin/src/ui/services/checkpoint.ts',
    'figma-hello-plugin/src/ui/store/logStore.ts',
  ]
---

# 1. 목적 및 가치

- Codex가 생성한 레이아웃 명령(JSON)을 기반으로 Figma 내부에서 UI를 자동 배치/수정하는 전용 플러그인을 제공한다.
- 문서 → 시각화 → 코딩 흐름에서 **시각화 단계**를 자동화해 설계 품질을 빠르게 확보한다.
- 설계·디자인·코드가 동일한 언어(Surface/Route/Slot/Component)를 공유하여 재작업과 혼선을 최소화한다.

# 2. 범위 및 사용자 시나리오

| 시나리오             | 설명                                                                                | 기대 효과                           |
| -------------------- | ----------------------------------------------------------------------------------- | ----------------------------------- |
| 레이아웃 자동 생성   | Codex가 전달한 JSON DSL을 읽어 Figma 페이지에 UI를 구성한다.                        | 시제품/디자인 초기화 시간 단축      |
| 기존 프레임 갱신     | 동일 Surface/Route에 대한 수정이 들어오면 증분 갱신으로 필요한 부분만 업데이트한다. | 기존 설계와 변경 내역의 추적성 확보 |
| Dry-run → Apply 승인 | Guardrail 검증과 프리뷰를 거쳐 승인된 결과만 실제 프레임에 반영한다.                | 품질 체계화, 승인 절차 명확화       |
| 체크포인트 생성      | 실행 결과를 Markdown 초안과 로그로 남긴다.                                          | 회고/감사 로그 가시화               |

# 3. 설계 원칙

## 3.1 용어/Name Contract

1. Surface(L1) → Route(L2) → Slot(L3) → Component(L4) 용어는 문서, Figma 레이어, 코드에서 동일한 한글/영문 병기 명칭을 사용한다.
2. 재사용 컴포넌트는 `COMP:<ComponentName>#<InstanceKey>` 규약을 따른다. 레지스트리에 없는 이름은 Guardrail에서 실패 처리한다.
3. 용어 변경이 필요할 경우 `admin/plan/figmaplugin-terminology.md`를 업데이트한 뒤 이 문서와 Roadmap에서 참조를 갱신한다.

## 3.2 레이아웃 DSL

1. DSL 계층은 Design Surface → Route → Slot → Section → Component 순으로 구성한다.
2. 각 노드는 `layout`, `slots`, `tokens`, `idempotentKey`, `op(add|update|remove)` 속성을 필수로 포함한다.
3. `sm/md/lg` 브레이크포인트 override는 “기본 값 → breakpoint override” 우선순위로 해석하며 Manifest, Runtime, UI 프리뷰가 동일하게 반영한다.
4. DSL을 변경할 때는 Manifest(`scripts/manifest`), Runtime(`surface-config`, `slot-manager`), UI 스토어가 동일 커밋에서 갱신되어야 한다.

## 3.3 증분 갱신

1. 런타임은 기존 노드를 삭제하지 않고 diff 기반으로 패치한다.
2. `pluginData`에는 `schemaVersion`, `slotId`, `layoutHash`, `createdBy`, `timestamp`를 기록한다.
3. Diff 결과는 ResultLog와 체크포인트 초안 모두에 반영되어야 하며, 실패 시 롤백 루틴을 실행한다.

## 3.4 토큰 거버넌스

1. 색상/타이포/간격은 Variables → Styles → Raw 값 순으로 해석한다.
2. 다크/라이트 모드 전환은 변수 모드 토글만으로 처리하며 하드코딩을 금지한다.
3. 토큰 변경 이력은 Guardrail Summary와 ResultLog에 기록하고 Dev Workspace 문서와 동기화한다.

## 3.5 관찰성·로그

1. Dry-run/Apply 결과는 Guardrail Summary, ResultLog, 체크포인트 초안에 동일한 메타데이터(선택 Surface/Route/Slot/Component, intent, 생성/경고/오류 수치, diff 데이터, payload 해시)를 남긴다.
2. 로그 히스토리는 최대 20개를 유지하며 Undo/Redo가 가능해야 한다.
3. 실패 시 오류 코드·사용자 메시지·재현 가능한 payload 스냅샷을 함께 기록한다.

## 3.6 트리 UX

1. Surface(L1) 탭 → Route(L2) → Slot(L3) → Component(L4) 계층을 지원하고, 상위 체크 시 하위 자동 선택/부분 선택 시 하프 체크 상태를 유지한다.
2. 선택 상태는 SectionList, Schema Preview, Execution payload와 즉시 동기화되어야 한다.
3. 펼침/선택 스냅샷은 `routeStore`·`sectionStore`와 체크포인트에 저장한다.

## 3.7 UI 상태/서비스 구조

- **Stores** — `surfaceStore`, `routeStore`, `sectionStore`, `schemaStore`, `executionStore`, `previewStore`, `logStore`, `targetStore`로 분리한다. 각 store는 Signals 기반으로 하나의 책임만 갖고, `index.ts`에서는 store 조합과 Provider 설정만 담당한다.
- **Services** — `execution.ts`(Dry-run/Apply 파이프라인), `schema-builder.ts`(선택 섹션→SchemaDocument 변환), `preview.ts`(프리뷰 프레임 이동/히스토리), `checkpoint.ts`(체크포인트 초안), `io-listener.ts`(런타임 메시지 분배), `quick-actions.ts`(샘플/Hello/체크포인트 트리거)로 나누어 테스트 가능성을 높인다.
- 모든 store/service 파일은 단일 책임·200LOC 이하 원칙을 지키고, cross-layer 로직은 파사드 파일에서만 결합한다.

## 3.8 Dry-run 프리뷰 UX

1. **프리뷰 전용 프레임** — Dry Run 시 2000×1200 회색(#f3f4f6) 배경의 프레임을 좌표(-2100, -1300)에 생성/재사용한다. 상단 검은 배너에는 시간·선택한 Surface/Route·타깃 페이지를 표기한다.
2. **시각화 구성** — 분홍 영역(좌측)에 실제 렌더링 결과를, 노란 영역(우측)에 실행 요약(생성 슬롯 수, 경고/오류, 체크포인트 메모)을 표시한다. 슬롯 경계와 라벨, 경고 아이콘은 분홍 영역에서 즉시 확인 가능해야 한다.
3. **확정 플로우** — 프리뷰 프레임에서 Apply 시 실제 타깃 프레임을 교체하고, Guardrail Summary·ResultLog·체크포인트 초안에 동일한 메타데이터를 남긴다. Dry Run 완료 후에는 “프리뷰로 이동” 액션과 프리뷰 초기화/히스토리 보관 경로(`_preview_history/`)를 제공한다.
4. **경고 연동** — 노란 영역 요약과 Guardrail 경고를 동기화해 실패 원인을 즉시 확인하고, 체크포인트 초안에도 같은 정보를 복사한다.

## 3.9 UI 컴포넌트 매핑

- `SurfaceTabs/` — Surface 탭 렌더링, 필수 슬롯/경고 뱃지, Surface 통계.
- `RouteTree/` — Route/Slot 트리와 SlotSummary. 수용 기준: Manifest 라벨/카운트 일치, 상위/하위 선택 동기화, 스냅샷 기록.
- `SectionList/` — 섹션 목록·검색·선택 요약.
- `SchemaEditor/` — JSON 미리보기/편집 탭, Readonly/Editor 패널.
- `ExecutionPanel/` — Dry-run/Apply 버튼, TargetSelect, GuardrailSummary.
- `PreviewControls/` — 프레임 포커스, 섹션 하이라이트, Before/After 슬라이더.
- `QuickActions/` — 샘플 로드, Hello 프레임 생성, 체크포인트 초안.
- `ResultLog/` — 실행 로그, Guardrail 메트릭, Slot diff, Undo/Redo 히스토리.
- 모든 컴포넌트는 Signals 기반 store와 service를 통해 상태를 구독하며, 선택/실행 결과가 Schema Preview·Execution payload·Guardrail Summary와 즉시 동기화되어야 한다.

# 4. 핵심 기능 및 수용 기준

## 4.1 레이아웃 자동화

- Codex DSL을 파싱해 Surface/Route/Slot 구조로 노드를 생성한다.
- AutoLayout 속성(`primaryAxisSizingMode`, `counterAxisSizingMode`, `layoutAlign`, `layoutGrow`)이 DSL 값과 일치해야 한다.
- 토큰 매핑 실패 시 드라이런을 중단하고 Guardrail 오류 메시지를 출력한다.

## 4.2 트리 탐색 및 섹션 선택

- Surface 탭에서 Route/Slot/Component 계층을 펼침/접힘으로 탐색한다.
- 상위 체크 → 하위 자동 선택, 하위 일부 선택 → 상위 하프 체크 상태를 표시한다.
- 선택된 섹션은 Schema Preview와 Execution payload에 즉시 반영되어야 한다.

## 4.3 실행 파이프라인 (Dry-run/Apply)

- Dry-run 실행 시 Guardrail 검증이 통과해야 Apply 버튼이 활성화된다.
- TargetSelect에서 페이지/프레임/모드를 변경하면 payload·Preview·ResultLog가 동기화된다.
- Apply 실행 시 Slot diff(added/updated/removed)가 ResultLog와 체크포인트 초안에 기록된다.

## 4.4 Quick Actions & Checkpoint

- 각 Quick Action 버튼은 선행 조건(실행 로그 존재 등)을 만족할 때만 활성화된다.
- 실행 성공·실패 결과를 Guardrail Summary, ResultLog, 체크포인트 Draft에 공통으로 기록한다.
- 체크포인트 초안에는 선택 스냅샷, diff 요약, Guardrail 요약, schemaVersion, intent가 포함되어야 한다.

## 4.5 관찰성 & 로그

- Guardrail Summary는 생성/경고/오류 메트릭과 실행 추세를 제공한다.
- ResultLog는 최대 20개의 실행 기록을 보관하고 Undo/Redo를 지원한다.
- 로그 항목에는 Slot diff, Guardrail 메트릭, intent, payload 해시, 선택 메타가 포함되어야 한다.

## 4.6 UI 컴포넌트 행동 기준

| 컴포넌트                       | 핵심 규칙                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| RouteTree                      | 계층 구조, 체크박스 동기화, Manifest 라벨/카운트 일치, 선택 상태 스냅샷 기록         |
| SectionList                    | 트리 선택과 동기화, 검색/필터, 선택 요약 제공                                        |
| SchemaEditor                   | 선택된 섹션 JSON 미리보기/편집, 비교 뷰 제공, 읽기 전용 모드 유지                    |
| ExecutionControls/TargetSelect | Dry-run 성공 후 Apply 활성화, Target 변경 시 payload·Preview·ResultLog 즉시 갱신     |
| Guardrail Summary              | 메트릭/경고/오류 및 추세 표시, 토큰/레이아웃 검증 결과 노출                          |
| PreviewControls                | 프레임 포커스·섹션 하이라이트·Before/After가 최신 Dry-run 결과와 일관                |
| QuickActions                   | 선행 조건 검증 후 실행, 성공/실패 로그를 Guardrail·ResultLog·Checkpoint에 공통 기록  |
| ResultLog                      | Slot diff, Guardrail 메타, intent, payload 해시 저장. 20개 히스토리와 Undo/Redo 제공 |
| Checkpoint Draft               | 선택 스냅샷, diff, Guardrail 요약, schemaVersion, intent 포함                        |

# 5. 아키텍처 개요

| 계층           | 설명                                                                        | 주요 파일                                                       |
| -------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------- |
| DSL & Manifest | DSL 정의, 검증, TS 산출물 생성                                              | `scripts/manifest/*`, `figma-hello-plugin/src/schema.ts`        |
| Runtime        | Surface-config, SlotManager, Guardrails, Executor 모듈                      | `figma-hello-plugin/src/runtime/*`                              |
| UI & 스토어    | RouteTree·ExecutionControls·Preview·ResultLog 등 Preact UI와 Signals 스토어 | `figma-hello-plugin/src/ui/*`                                   |
| Observability  | Guardrail Summary, ResultLog, checkpoint 서비스                             | `figma-hello-plugin/src/ui/services/{guardrail,checkpoint,log}` |

# 6. 실행 및 추적 문서

- **실행 순서·진척 관리**: `admin/plan/figmaplugin-roadmap.md`
- **용어 기준**: `admin/plan/figmaplugin-terminology.md`
- **체크포인트 기록**: `admin/checkpoints/`
- **Legacy 참고**: `admin/plan/legacy/figmaplugin-refactor.md` (과거 리팩터링 플랜)

# 7. 참고 자료 & API 레퍼런스

- Figma Plugin API: <https://www.figma.com/plugin-docs/api/>
- Plugin manifest v2: <https://www.figma.com/plugin-docs/manifest/>
- UI 러너(Webview) 가이드: <https://www.figma.com/plugin-docs/how-plugins-run/>
- 샘플 플러그인: <https://www.figma.com/plugin-docs/plugin-samples/>
- 내부 참고: `admin/references/figmaplugin/*`, `admin/specs/figmaplugin-p1-design.md`, `admin/plan/design-contract.md`

# 8. 변경 로그

- 2025-10-01 — 핸드북·리팩터 문서의 공통 규칙과 수용 기준을 본 문서로 통합하고, 실행 문서와 용어 문서를 각각 분리 참조하도록 재정비.
- 2025-09-30 — 실행 계획과 수용 기준을 6장에 통합, P1 우선 순서 재정렬.
