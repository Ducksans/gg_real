---
file: admin/plan/legacy/figmaplugin-refactor.md
title: Figma Plugin 컴포넌트화 리팩터링 계획
owner: duksan
created: 2025-09-30 06:10 UTC / 2025-09-30 15:10 KST
updated: 2025-10-01 13:08 UTC / 2025-10-01 22:08 KST
status: draft
tags: [plan, figma, refactor]
schemaVersion: 1
description: 플러그인 런타임·UILayer·Manifest 빌더를 기능 단위 모듈로 분리하고 테스트/품질 게이트를 정비하기 위한 리팩터링 로드맵
doc_refs: ['admin/plan/figmapluginmake.md', 'admin/plan/figmaplugin-roadmap.md']
code_refs: []
---

# 1. 배경

- **현재 런타임 구조**: `figma-hello-plugin/src/runtime.ts` 한 파일이 Surface DSL 변환, Guardrail 검사, Dry-run/Apply 실행, 슬롯 동기화, 플러그인 메타데이터 주입까지 모두 담당하고 있다. Surface/Slot 정의는 Manifest에서 불러온 뒤 즉석에서 해시를 계산하고(`runtime.ts:46` 근처), Dry-run과 Apply는 동일한 코드 경로를 타며 intent 플래그만 바꾼다(`runtime.ts:223-420`). 증분 갱신을 지원하는 것처럼 보이지만 실제로는 `syncSlotChildren` 단계에서 기존 노드를 통째로 제거 후 재생성하기 때문에(`runtime.ts:640-720`) Before/After 비교나 부분 갱신을 붙이려면 구조 자체를 다시 쪼개야 한다.
- **노드/토큰 처리 병목**: 노드 생성은 `figma-hello-plugin/src/lib/nodeFactory.ts:20-124`에 집중돼 있고, 현재 Text/Frame/Stack/Spacer만 지원한다. 스키마에 정의된 Component/Image 타입은 런타임에서 바로 `figma.notify` 경고를 띄우고 무시하기 때문에 UX 확장이 막혀 있다. 토큰 해석(`tokenRegistry.ts:1-110`)과 스타일 캐시는 전역 함수로 얽혀 있어 Slot 단위 검증이나 스타일 대체 전략을 독립적으로 테스트할 방법이 없다.
- **UI 상태 및 UX 한계**: 플러그인 패널은 단일 HTML 파일(`figma-hello-plugin/src/ui/index.html:320-720`) 안에 스타일, DOM 템플릿, 상태, 이벤트가 뒤섞여 있다. Surface → Route → Slot 트리, 섹션 선택, Dry-run 실행, 로그/경고 표시는 모두 전역 배열과 Map을 공유하며 즉시 DOM을 조작한다. 프리뷰 프레임, Before/After 슬라이더, 체크포인트 초안 등 새로운 UX를 붙이려면 상태 구조부터 갈아엎어야 하므로 실험이 멈춰 있는 상황이다.
- **입력→출력→전달→보고→감사 흐름의 단절**: 입력(JSON 스키마)은 Manifest와 섹션 파일에서 읽어 오지만, 출력된 노드/로그가 어디에 저장되고 누가 검증하는지 명확하지 않다. Dry-run 결과는 UI 로그에만 남고(`notifier.ts:1-20`), 체크포인트 초안 버튼은 더미 경고만 띄운다. 감사(LOT 기록)를 위해 필요한 pluginData는 붙지만, 현재 구조에서는 어떤 슬롯이 언제 어떤 의도로 갱신됐는지 추적 로그를 남길 모듈이 따로 없다. 결국 “입력→실행→상태 보고→검증→감사” 사이클이 연결되지 않아 프리뷰 UX나 승인 플로우가 중간에서 끊긴다.
- **기술 부채 요약**: 기존 Manifest 빌더(`scripts/build-archetype-manifest.js`)는 Node 스크립트 한 파일로 Surface/Route/Slot을 읽어서 바로 TS 파일을 생성했다. 런타임/빌더/UITree가 단일 책임을 벗어나 있는 탓에 테스트를 붙이거나 특정 레이어만 교체하는 작업이 어려워, 이를 TS 기반 `scripts/manifest/` 모듈로 분리한 뒤 P1 수용 기준을 재검증하려는 것이 이번 리팩터링의 의도다.

# 1-1. 공통 규칙 준수

- `admin/plan/figmapluginmake.md` 4장(공통 규칙)에서 정의한 Name Contract·레이아웃 DSL·증분 갱신·토큰 거버넌스·관찰성 정책을 본 리팩터링에서 필수 준수 항목으로 삼는다.
- 용어 매핑(Surface/Route/Slot/Component)과 DSL 필드 정의가 문서·Figma·코드 간 일치하지 않는 경우 Guardrail Summary와 ResultLog에 오류를 기록하고 실행을 중단한다.
- 공통 규칙 위반 여부는 각 단계의 수용 기준에서 선행 검증해야 하며, 새 기능 추가 시 해당 규칙을 재검토한다.
- 단계별 TODO와 의존성, 최신 진행 상황은 `admin/plan/figmaplugin-roadmap.md` 대시보드와 동기화한다.

# 2. 리팩터링 목표

- 런타임, 데이터 파서, UI, 스크립트를 기능별 모듈로 분리하여 단일 책임을 보장한다.
- 모듈 간 인터페이스를 명시화하고 단위 테스트를 추가해 회귀 리스크를 낮춘다.
- 향후 React/Preact 기반 UI 전환 및 CLI/자동화 스크립트 확장을 위한 토대를 만든다.

# 2-1. TODO 대시보드 (단일 진척 관리)

| ID         | 범주                 | 상세 설명                                                                        | 선행/의존  | 상태 | 예상 산출물                             | 최근 업데이트 |
| ---------- | -------------------- | -------------------------------------------------------------------------------- | ---------- | ---- | --------------------------------------- | ------------- |
| TODO-P1-01 | Manifest             | `scripts/manifest` Validator/Normalizer/Emitter 분리 및 AJV 스키마 업데이트      | P0 완료    | 진행 | `scripts/manifest/*.ts`, 체크포인트     | 2025-09-30    |
| TODO-P1-02 | Runtime              | `surface-config`, `slot-manager`, `executor`, `guardrails` 모듈화 및 단위 테스트 | TODO-P1-01 | 진행 | 런타임 서브모듈, 테스트 로그            | 2025-10-01    |
| TODO-P1-03 | 증분 갱신            | `pluginData` 표준키 적용, diff-engine 개선, ResultLog/Checkpoint diff 포함       | TODO-P1-02 | 대기 | ResultLog diff 필드, checkpoint 템플릿  | —             |
| TODO-P2-01 | RouteTree UX         | 계층별 펼침/체크, Manifest 라벨/카운트 연동, 선택 상태 스냅샷                    | TODO-P1-02 | 진행 | RouteTree 컴포넌트, `routeStore`        | 2025-10-01    |
| TODO-P2-02 | ExecutionControls    | Dry-run/Apply 활성화 조건, TargetSelect 동기화, 실패 메시지                      | TODO-P1-02 | 진행 | `ExecutionControls.tsx`, Guardrail 로그 | 2025-10-01    |
| TODO-P2-03 | QuickActions/Preview | 선행 조건 검증, 관찰성 메타 기록, 실패 핸들링                                    | TODO-P1-02 | 대기 | QuickActions 서비스, ResultLog 항목     | —             |
| TODO-P2-04 | ResultLog/Guardrail  | Slot diff, payload 해시, Undo/Redo 20개 유지                                     | TODO-P1-03 | 대기 | `logStore`, Guardrail Summary 추세      | —             |
| TODO-P3-01 | 문서/테스트          | 공통 규칙 링크 점검, CI에 UI/Runtime smoke 테스트 추가                           | P2 완료    | 대기 | Docs 업데이트, GitHub Workflow          | —             |

상태 변경 시 동일 ID를 체크포인트와 ResultLog에 남기고, 완료 시 산출물 링크(커밋/PR/문서)를 표에 추가한다. 반복 요구사항은 백로그로 이동하여 우선순위를 조정한다.

## 2-2. 백로그

| ID    | 설명                                 | 고려 시점  |
| ----- | ------------------------------------ | ---------- |
| BL-01 | 프리뷰 프레임 자동 생성 UX 실험 재개 | P2 종료 후 |
| BL-02 | Dry-run QA 체크리스트 자동화         | P3 진행 중 |
| BL-03 | 플러그인 배포 전략 문서화            | P3 이후    |

# 3. 모듈 구조 제안

| Layer            | 경로 제안                           | 주요 책임                                             |
| ---------------- | ----------------------------------- | ----------------------------------------------------- |
| Surface DSL      | `src/runtime/surface-config.ts`     | manifest/문서에서 Surface/Slot 정의 읽기, 해시 계산   |
| Slot Manager     | `src/runtime/slot-manager.ts`       | 슬롯 컨테이너 생성·동기화, pluginData 메타 관리       |
| Guardrails       | `src/runtime/guardrails.ts`         | Dry-run 사전 검증 로직, 경고/오류 메시지 템플릿       |
| Executor         | `src/runtime/executor.ts`           | runSchemaDocument/batch 제어, Dry-run/Apply 후속 처리 |
| Manifest Builder | `scripts/manifest/{loader,emit}.ts` | JSON 읽기, 구조 검증, 산출물 출력                     |
| UI State         | `src/ui/state.ts`                   | manifest 로드, 선택 상태, postMessage API 관리        |
| UI Components    | `src/ui/components/*.ts`            | Surface 탭, Route/Slot 트리, 결과 패널, 로그 패널 등  |

# 3-1. Dry-run 프리뷰 UX 시나리오 (초안)

1. **프리뷰 프레임 자동 생성**
   - Dry-run 버튼 → 선택한 섹션을 2000×1200 회색(#f3f4f6) 배경의 프리뷰 전용 프레임(`PluginUIMock_preview`)에 렌더링.
   - 프레임은 좌표(-2100, -1300)에 고정 생성하여 언제나 같은 위치에서 확인 가능.
   - 구성
     - 상단 검은 배너: “드라이런 전용 프레임” 안내 + 타임스탬프 + 선택한 라우트/페이지 요약.
     - 분홍 영역(왼쪽): 실제 레이아웃 미리보기. 슬롯 경계선, 라우트/슬롯 라벨, 경고 아이콘 표시.
     - 노랑 영역(오른쪽): 실행 결과 요약(생성 슬롯 수, 경고/오류, 체크포인트 메모 등)을 리스트/표로 제공.
   - 프리뷰 프레임을 재사용하며, 새 드라이런 시 기존 요소를 덮어쓰기. 필요 시 `_preview_history/` 아래로 이전 결과를 아카이브.
2. **확정 플로우**
   - 플러그인 패널에서 최근 Dry-run 로그를 선택 → “실행 반영(Apply)” 클릭 시 프리뷰 내용을 기준으로 실제 타깃 프레임을 `replace` 처리하고 체크포인트 초안/로그 생성.
   - Dry-run 완료 시 패널에 “프리뷰 프레임으로 이동” 버튼을 띄워 즉시 카메라를 이동시킬 수 있도록 한다.
   - 확정 후 프리뷰 프레임은 초기 상태(분홍/노랑 기본 안내만 표시)로 되돌리거나, ‘최근 확정’ 정보로 잠시 표시해 사용자에게 확정 결과를 다시 보여준다.
3. **체크포인트/문서 연동**
   - 노랑 영역의 요약 데이터를 체크포인트 초안에 그대로 복사하고, Dry-run 실패/경고 메시지를 프리뷰 프레임 하단 붉은 배너로 중복 표시해 시각적 인지도를 높인다.
   - Dry-run 로그는 타임스탬프와 함께 프리뷰 프레임의 위치 링크를 제공해 언제든지 재검토 가능하도록 한다.

# 3-2. UX 확장 아이디어(실행 가능성 검토)

- **슬롯 미니맵**: 프리뷰 상단에 슬롯 구성을 격자 미니맵으로 표시, 슬롯 클릭 시 프리뷰 내부로 카메라 이동. (Plugin API의 `setRelaunchData`와 selection 연동으로 구현 가능)
- **Before/After 슬라이더**: 이전 Apply 결과와 이번 Dry-run 결과를 같은 위치에 겹쳐 놓고 슬라이더로 비교. (두 프레임을 `opacity` 조정하거나 clip mask로 구현)
- **주석 레이어**: 각 슬롯에 자동 주석(포스트잇) 추가, `setPluginData`로 메타 기록 후 Apply 시 체크포인트에 반영.
- **타임라인 재생**: Dry-run 로그 순서대로 슬롯 생성 애니메이션 재생. (`cloneNode` + `setTimeout`으로 순차 나타내기)
- **QA 체크리스트 패널**: 노랑 영역에 자동 검증 결과(토큰, 경고, 접근성)를 표시하고 항목별로 슬롯을 하이라이트.
- **슬롯 히트맵**: 슬롯별 컴포넌트 수/면적을 컬러 오버레이로 시각화. (fill 색상과 `blendMode` 활용)
- **멀티 프리뷰 탭**: 모바일/태블릿/데스크톱 등 브레이크포인트 프레임을 미니 버전으로 동시에 생성.
- **프리뷰 HUD**: 프리뷰 상단에 Dry-run 버전, 사용자, 경고 수를 표시하는 HUD 컴포넌트를 렌더.
- **인터랙티브 슬롯 액션**: 슬롯별 버튼으로 “빈 슬롯 채우기/교체/확대” 등을 제공, 선택 즉시 해당 슬롯 재생성.
- **자동 동기화 알림**: 섹션 수정 감지 시 프리뷰 배너를 “Out of date”로 바꾸고, 패널에서 “프리뷰 재생성” 버튼 강조.

# 3-3. 런타임 계층 상세 설계 (1파일 1책임 규칙)

- **surface-config/**
  - `index.ts`: Surface 설정 조회 파사드. 외부에서는 이 파일만 임포트한다.
  - `normalizer.ts`: Manifest Raw 데이터를 런타임용 구조로 변환한다.
  - `hash.ts`: Surface/Slot 해시 계산만 담당한다. (LOC ≤ 120)
  - `registry.ts`: Normalized Surface/Slot 캐시와 필수 슬롯 목록을 관리한다.
  - `types.ts`: Surface 관련 타입 정의만 보관한다.
- **slot-manager/**
  - `index.ts`: Slot 배치 API. SurfaceConfig/NodeSync/Metadata를 조합한다.
  - `container-factory.ts`: 타깃 프레임과 슬롯 컨테이너 생성/AutoLayout 적용.
  - `diff-engine.ts`: 기존 자식과 새 스펙을 비교하고 add/update/remove 목록을 만든다.
  - `metadata.ts`: pluginData 표준키를 세팅하고 감사 메타를 기록한다.
  - `reporter.ts`: 실행 결과를 DTO로 만들어 Executor에게 전달한다.
- **guardrails/**
  - `index.ts`: Guardrail 평가 파이프라인 조립.
  - `counters.ts`: 노드 수/깊이/JSON 크기 계산만 수행.
  - `validators.ts`: 슬롯 허용 여부 등 구조 검사를 수행.
  - `thresholds.ts`: 허용치 테이블과 환경별 override를 정의.
  - `messages.ts`: 경고/오류 메시지 템플릿을 한 곳에서 관리.
- **executor/**
  - `index.ts`: Dry-run/Apply 엔트리 포인트. Intent 전환만 담당한다.
  - `context-factory.ts`: 실행 옵션, SurfaceConfig, Guardrail 결과를 묶은 Context 객체를 만든다.
  - `dry-run.ts`: 프리뷰 프레임 정책과 SlotManager 호출을 담당한다.
  - `apply.ts`: 실제 적용/선택 이동/Undo 보호 로직만 처리한다.
  - `result-dto.ts`: Runtime→UI 전달 DTO 스키마만 정의한다.
- **io-channel/**
  - `index.ts`: 런타임에서 사용할 송신 헬퍼. postMessage 호출만 수행.
  - `message-types.ts`: 런타임↔UI 왕복 메시지 타입/페이로드 정의.
  - `dispatcher.ts`: 수신 메시지를 Executor/서비스로 라우팅한다.
  - `logger.ts`: 메시지 로그/디버깅 훅. 테스트 시 안전하게 스텁 가능.
- 각 디렉터리의 파일은 책임이 1개이며 200줄 이하, 순환 의존 금지(ESLint 규칙 추가 예정). 공용 util은 `src/runtime/utils/`로 이동하되 파일당 1 util만 허용한다.

# 3-4. 데이터/유틸 계층 상세 설계

- **scripts/manifest/**
  - `loader.ts`: JSON 파일을 읽어 객체로 반환한다.
  - `validator.ts`: Schema를 AJV로 검사한다.
  - `normalizer.ts`: Surface/Route/Section 구조를 정규화.
  - `emitter.ts`: TS 소스코드 생성만 담당한다.
  - `watcher.ts`: 개발 모드에서 파일 변경을 감지한다.
- **schema/**
  - `parser.ts`: Raw JSON → `SchemaDocument`. 필수 필드 보정.
  - `idempotent.ts`: idempotentKey 채움/검증 전용.
  - `validator.ts`: 파싱 후 구조 검증 수행.
  - `merge.ts`: 다중 섹션 병합 전용 유틸.
- **token/**
  - `registry.ts`: Resolve API 파사드.
  - `paint.ts`, `typography.ts`, `radius.ts`: 각 토큰 타입만 담당.
  - `cache.ts`: Figma 스타일 캐시 초기화/무효화.
  - `provider.ts`: 향후 변수/외부 소스 연결용 인터페이스.
- **notifier/**
  - `index.ts`: 외부 사용 API (success/warning/error/result)만 노출.
  - `toast.ts`: figma.notify 래퍼.
  - `event-bus.ts`: UI 메시지 전송.
  - `formatter.ts`: 로그 메시지 형식화.
- 모든 데이터/유틸 파일은 단일 책임을 지키며, cross-layer 로직은 파사드(index)에서만 결합한다.

# 3-5. UI 상태/서비스 계층 상세 설계

- **store/**
  - `surfaceStore.ts`: Surface/Route/Slot 선택 상태.
  - `sectionStore.ts`: 섹션 선택/검색/정렬.
  - `schemaStore.ts`: 병합된 JSON, 편집 내용.
  - `executionStore.ts`: 실행 로딩/결과 요약.
  - `previewStore.ts`: 프리뷰 프레임/히스토리 상태.
  - `logStore.ts`: Dry-run/경고 로그 이력.
  - `targetStore.ts`: 페이지/프레임/모드 선택 상태.
  - `index.ts`: Store 조합과 Provider 설정만 담당.
- **services/**
  - `execution.ts`: Dry-run/Apply 파이프라인 조립.
  - `schema-builder.ts`: 선택 섹션을 SchemaDocument 배열로 변환.
  - `preview.ts`: 프리뷰 프레임 이동/히스토리/슬라이더.
  - `checkpoint.ts`: 체크포인트 초안 생성.
  - `io-listener.ts`: 런타임 메시지 수신 후 Store로 분배.
  - `quick-actions.ts`: 플러그인 샘플/헬로 실행/체크포인트 생성 요청을 래핑.
  - `analytics.ts`: 실행/선택 이벤트를 로깅(선택 사항).
- 각 Store/Service 파일의 책임을 명확히 분리해 디버깅 시 영향 범위를 즉시 파악 가능하도록 한다.

### 3-5-1. 스타일/레이아웃 재구성

1. `app.css` 분해
   - **Base Layout** (`styles/base-layout.css`): `html`, `body`, `#root`, `plugin-root`, `plugin-shell`, `workspace`, 사이드바 등 루트/그리드 전용 스타일.
   - **Component Styles**: RouteTree, ExecutionControls, Preview, ResultLog, QuickActions 등은 각 컴포넌트 폴더 하위(`RouteTree/route-tree.css` 등)에 배치한다.
   - **Utility Tokens** (`styles/tokens.css`): 컬러·타이포·spacing 토큰만 정의.
2. 높이 사슬 정비
   - HTML → body → #root → `.plugin-root` → `.plugin-shell` → `.workspace` → `.workspace__sidebar`까지 `height: 100%`, `min-height: 0`, 필요한 곳은 `overflow: hidden`을 지정해 RouteTree가 남은 공간을 차지하도록 한다.
3. 레거시 클래스 정리
   - `.panel`, `.plugin-shell`, `.workspace__*` 등 레거시 클래스는 Preact 컴포넌트 책임과 일치하도록 재구성하거나 컴포넌트 내부 래퍼로 교체하고, 각 컴포넌트가 자기 스타일 모듈만 import하도록 한다.
4. 마이그레이션 절차
   - (1) Base/Layout/Component 스타일 파일을 만든 뒤 `app.css`에서 블록을 이동시키고 import 경로를 업데이트한다.
   - (2) 상위 컨테이너의 높이/플렉스 규칙을 Base Layout에서 정의한 뒤, RouteTree·ExecutionControls·Preview 영역의 스크롤 동작을 수동 검증한다.
   - (3) UI 빌드 및 테스트(`pnpm --filter gg-figma-plugin build:ui`, `pnpm --filter gg-figma-plugin test`)를 실행해 스타일 분리 후 회귀가 없는지 확인한다.

# 3-6. UI 컴포넌트 매핑 (파일 단위 세분화)

- `SurfaceTabs/`
  - `index.tsx`: Surface 탭 렌더링.
  - `SurfaceBadge.tsx`: 필수 슬롯/경고 뱃지.
  - `SurfaceStats.tsx`: 선택 Surface 통계.
  - 상태: 미구현 — Surface 탭 UI는 후속 이관 대상이며 현 코드에는 아직 작성되지 않았다.
- `RouteTree/`
  - `index.tsx`: Route/Slot 트리 루트.
  - `RouteNode.tsx`: Route 레벨 렌더링.
  - `SlotNode.tsx`: Slot 레벨 렌더링 및 전체 선택.
  - `SlotSummary.tsx`: 슬롯 설명/허용 섹션 표시.
  - 상태: 완료 2025-09-30 18:06 UTC / 2025-10-01 03:06 KST — RouteTree 시리즈를 Preact로 구현하고 routeStore와 연동했다.
  - 수용 기준: Surface(L1) 탭을 기준으로 Route(L2)→Slot(L3)→Component(L4) 계층을 제공하고, 상위 체크 시 하위 전체 선택·하위 일부 선택 시 상위 하프 체크 상태를 표시한다. 각 노드는 Manifest와 동일한 라벨/아이콘/카운트를 보여 주며, 선택 변화가 SectionList·Schema Preview·Execution payload에 즉시 반영되어야 한다. 펼침/선택 상태는 `routeStore`·`sectionStore`에 보존하고 ResultLog·체크포인트 Draft에 스냅샷으로 기록한다.
- `SectionList/`
  - `index.tsx`: 슬롯별 섹션 목록.
  - `SectionItem.tsx`: 개별 섹션 항목.
  - `SectionFilter.tsx`: 검색/필터 UI.
  - 상태: 완료 2025-09-30 18:06 UTC / 2025-10-01 03:06 KST — Signals 기반 필터·다중 선택을 구현해 sectionStore와 동기화했다.
- `SchemaEditor/`
  - `index.tsx`: JSON 뷰/편집 탭 전환.
  - `ReadonlyPanel.tsx`: 읽기 전용 프리뷰.
  - `EditorPanel.tsx`: 코드 편집기 래퍼.
  - 상태: 완료 2025-09-30 18:06 UTC / 2025-10-01 03:06 KST — 선택 섹션 JSON 미리보기/편집 탭 전환을 Preact 컴포넌트로 마이그레이션했다.
- `ExecutionPanel/`
  - `index.tsx`: 버튼/설정 묶음.
  - `TargetSelect.tsx`: 페이지/프레임 선택.
  - `GuardrailSummary.tsx`: 경고 요약.
  - 상태: 완료 2025-09-30 18:17 UTC / 2025-10-01 03:17 KST — TargetSelect를 Signals 기반 Preact 컴포넌트로 구현하고 execution 파이프라인에 페이지/모드/프레임 오버라이드를 연결했다.
- `ResultLog/`
  - `index.tsx`: 로그 리스트 컨테이너.
  - `LogEntry.tsx`: 로그 항목.
  - `MetricsBar.tsx`: 생성/경고/오류 수치.
  - 상태: 완료 2025-09-30 18:06 UTC / 2025-10-01 03:06 KST — Guardrail 메트릭과 경고/오류 배지를 포함한 로그 UI를 구현했다.
  - 수용 기준: 각 항목은 Slot diff(added/updated/removed), Guardrail 메트릭, 선택된 Surface/Route/Slot/Component, 실행 intent, payload 해시를 포함한다. 로그 스택은 최대 20개를 유지하며 Undo/Redo 시 선택·Guardrail 메타까지 롤백된다.
- `PreviewControls/`
  - `index.tsx`: 프리뷰 제어 허브.
  - `BeforeAfter.tsx`: 슬라이더 전용.
  - `SlotHighlight.tsx`: 슬롯 토글.
  - 상태: 완료 2025-09-30 18:06 UTC / 2025-10-01 03:06 KST — 프레임 포커스, 섹션 하이라이트, Before/After 뷰를 동작시키도록 연동했다.
  - 수용 기준: 모든 액션은 최신 Dry-run 결과와 일관된 데이터를 사용하고, 실패 시 사용자에게 명확한 메시지를 표시하며 Guardrail Summary에 경고를 남긴다.
- `QuickActions/`
  - `index.tsx`: 단축 액션 묶음.
  - `SampleLoader.tsx`: 샘플 로드 버튼.
  - `HelloAction.tsx`: Hello 프레임 생성.
  - `CheckpointAction.tsx`: 체크포인트 초안 다운로드.
  - 상태: 완료 2025-09-30 18:32 UTC / 2025-10-01 03:33 KST — Preact UI, 런타임 메시지, 체크포인트 초안 다운로드 흐름을 구현했다.
  - 수용 기준: 버튼별 선행 조건을 UI/스토어에서 검증하고, 실행 성공/실패 결과를 Guardrail Summary·ResultLog·체크포인트 Draft에 공통 메타로 남긴다. 실패 시 사용자 메시지와 Guardrail 경고를 동시에 노출한다.
- 모든 컴포넌트는 Props 타입을 별도 `types.ts`에 정의하고, 스타일은 `styles.css` 또는 모듈 CSS로 분리한다. 1파일 1UI 책임을 지켜 재사용과 디버깅을 단순화한다.

### TargetSelect · ExecutionControls 수용 기준

1. TargetSelect에서 페이지/프레임/모드를 변경하면 Execution payload, Preview 상태, ResultLog 메타가 즉시 갱신된다.
2. Dry-run 성공 후에만 Apply·Checkpoint Draft 버튼이 활성화되며, 실행 intent별로 slotReport와 Guardrail Summary가 업데이트된다.
3. 실행 오류 시 Guardrail Summary에 실패 사유와 payload 스냅샷을 기록하고, ResultLog에도 동일한 정보를 남긴다.

# 3-7. 상호 작용 흐름

1. 사용자가 Surface/Slot을 선택 → Store가 선택 상태를 업데이트하고 `SectionList`/`SchemaEditor`가 즉시 반응한다. — 완료 2025-09-30 18:06 UTC / 2025-10-01 03:06 KST (`routeStore`, `ExecutionPanel` 의존성 연동)
2. `ExecutionPanel`에서 Dry-run을 트리거 → `services/execution`이 SchemaDocument 배열을 구성하고 io-channel로 `execute-schema` 메시지를 보낸다. — 완료 2025-09-30 18:06 UTC / 2025-10-01 03:06 KST (`createExecutionService` 패이로드 구성)
3. Executor는 surface-config → guardrails → slot-manager → notifier 순으로 호출하고, 결과 DTO를 io-channel에 실어 UI로 보낸다. — 진행 (런타임 서브모듈 분리는 지속 작업 중)
4. UI의 `io-listener`가 결과를 수신 → Store에 Dry-run 결과/경고/프리뷰 정보 반영 → `ResultLog`와 `PreviewControls`가 즉시 갱신된다. — 완료 2025-09-30 18:06 UTC / 2025-10-01 03:06 KST (`io-listener.ts`, `previewStore` 갱신)
5. 사용자가 Apply를 선택하면 Executor가 같은 파이프라인을 intent `apply`로 실행하고, SlotManager가 생성/갱신 결과를 보고한다. — 완료 2025-09-30 18:28 UTC / 2025-10-01 03:28 KST (slotReport 페이로드를 확장해 execution/log/preview 스토어에 생성 노드/슬롯 정보를 기록)
6. 체크포인트 서비스가 Dry-run/Apply 결과를 바탕으로 초안을 생성하고, 필요 시 UI에서 바로 파일로 저장하도록 안내한다. — 완료 2025-09-30 18:32 UTC / 2025-10-01 03:33 KST (execution/log/preview/target 상태를 조합해 Markdown 초안과 다운로드 흐름을 제공)
7. 모든 실행 이벤트는 Store에 축적돼 Undo/Redo·감사 로그·세션 요약에 재사용된다. — 미구현 (이력 저장/재활용 로직 미도입)

### 실행·관찰성 플로우 수용 기준

1. Dry-run → Guardrail Summary → QuickActions/PreviewControls → ResultLog → Checkpoint Draft 단계에서 선택 메타(Surface/Route/Slot/Component)와 diff 데이터가 일관되게 유지돼야 한다.
2. 로그 히스토리는 20개를 초과하지 않으며 Undo/Redo 시 선택 상태·payload·Guardrail 메타가 함께 롤백된다.
3. Checkpoint Draft에는 선택 스냅샷, slot diff(added/updated/removed), Guardrail 요약, 실행 intent, schemaVersion이 포함되어야 한다.

# 3-8. 병목 제거형 서브모듈 설계

- **Slot Manager 실구현**
  - `container-factory.ts`, `strategies/index.ts`, `diff-engine.ts`, `metadata.ts`, `transformers/auto-layout.ts`로 책임을 분리해 컨테이너 생성·Slot 레이아웃·Diff 동기화·pluginData 주입을 모듈화했다.
  - `profiling.ts`와 `reporter.ts`는 후속 계측/리포트 확장 포인트로 남겨두고, 현재 단계에서는 기본 래퍼(측정/요약)만 구현했다.
- **Executor 오케스트레이션**
  - `context-factory.ts`에서 Target/Intent/Surface 컨텍스트를 구성하고, `index.ts`에서 Guardrails→SlotManager→Notifier 순으로 실행 흐름을 조립한다.
  - Dry-run/Apply 래퍼(`dry-run.ts`, `apply.ts`)는 intent에 따른 프레임명 조정과 후속 파이프라인 교체를 위한 훅 지점으로 마련했다.
- **Token Registry 구조화**
  - `providers/`, `resolvers/`, `cache/`, `registry.ts`로 토큰 소스·해석·캐시 무효화를 나누고, Runtime/SlotManager가 공통 파사드를 통해 호출하도록 정리했다.
- **UI Store/Service/Component 베이스**
  - Store/Service/Component 디렉터리에 생성한 스텁은 각 책임(선택 상태, 실행 파이프라인, 프리뷰/Result UI)을 개별 파일로 유지해 추후 구현 시 경계가 겹치지 않게 했다.
- **Guardrails/SurfaceConfig 재사용성 확보**
  - Guardrails는 `counters.ts`, `validators.ts`, `thresholds.ts`로 노드 수/깊이/JSON 크기/슬롯 허용 여부 검사를 분리했고, SurfaceConfig는 `normalizer.ts`, `registry.ts`, `hash.ts`로 Manifest→Runtime 변환과 캐시/해시 계산을 담당한다.

# 4. 작업 순서

1. **준비(P0)**: 현재 manifest/런타임/UITree 사용 패턴 점검, 상호 의존성 정리, 테스트 샘플(json/expected)을 확보한다. _(완료 2025-09-30 11:24 UTC / 2025-09-30 20:24 KST — 런타임 의존 관계 분석, manifest 스냅샷, 샘플/테스트 목록화 완료)_
2. **Manifest 모듈화(P1)**
   - `scripts/build-archetype-manifest.js`를 TS 기반 `scripts/manifest/`로 분리(Loader/Builder/Emitter). _(완료 — `scripts/manifest/{loader,builder,emitter,index}.ts` 도입, `pnpm exec tsx scripts/manifest/index.ts`로 재생성)_
   - Surface/Route/Slot 구조 검증 및 JSON Schema 초안 작성.
3. **런타임 분리(P1)**
   - `runtime.ts`를 위에서 정의한 SurfaceConfig/SlotManager/Guardrails/Executor 모듈로 쪼개고, `index.ts`에서 조립. _(진행 — 실행 오케스트레이션을 `runtime/executor`로 이동하고, `surface-config`, `guardrails`, `slot-manager` 서브모듈에 실 구현 배치)_
   - 기존 API(`runSchemaFromString`, `runSchemaBatch`, `runSchemaDocument`)와 메시지 포맷 유지.
   - SlotManager `strategies/`, `transformers/`, `metadata/` 모듈을 활성화해 컨테이너 생성·레이아웃·Diff 동기화를 분리하고 Token Registry `providers/`, `resolvers/`, `cache/` 구조를 호출 경계로 활용한다.
4. **UI 분리(P2)** _(진행 2025-09-30 18:06 UTC / 2025-10-01 03:06 KST — SectionList·SchemaEditor·RouteTree·PreviewControls·ResultLog 이관 완료, TargetSelect·QuickActions 대기)_
   - manifest 로더와 상태 관리, 컴포넌트 렌더링 로직을 파일 단위로 나눠 Webpack/esbuild 번들을 적용.
   - Route/Slot 트리 컴포넌트에서 manifest 타입 정의를 재사용.
5. **테스트/품질 게이트 정비(P2)**
   - Surface/Slot 파서, Guardrails, SlotManager에 대한 단위 테스트 추가.
   - `npm run test:runtime`, `npm run test:manifest` 등 스크립트 정의.
6. **문서화 및 체크포인트(P2)**
   - 문서(`admin/plan/figmapluginmake.md`, `admin/specs/figmaplugin-p1-design.md`)에 새 모듈 구조와 사용법을 반영.
   - 리팩터링 완료 후 체크포인트 생성.

# 5. 수용 기준

- 런타임/Manifest/UI가 정의된 모듈 경로로 분리되고, `runtime.ts` 및 기존 스크립트 대비 LOC가 크게 줄어든다(각 모듈 250줄 이하 목표).
- `npm run build` 및 새 테스트 스크립트가 성공하며, Dry-run/Apply 기능이 리팩터링 전과 동일하게 동작한다.
- 문서와 코드의 상호 참조(code_refs/doc_refs)가 최신 구조를 반영한다.
- 회귀 대응을 위해 최소 3가지 샘플 JSON 시나리오에 대한 Dry-run 결과가 리팩터링 전과 일치한다.
- SlotManager/Executor/Token Registry/ResultLog/PreviewControls 디렉터리에 서브모듈(`strategies/`, `commands/`, `providers/`, `aggregator/`, `comparisons/` 등)이 존재하고 각 파일이 단일 책임과 LOC≤200을 충족한다.

# 6. 일정 및 의존 관계

- 착수 시점: `chore: snapshot plugin state before refactor` 커밋(프리뷰 UX 실험 직전) 이후, P1 산출물이 막힌 채로 즉시 리팩터링 스프린트를 시작한다. P1 안정화가 완료된 후가 아니라, 막힌 지점(런타임 재구성/프리뷰 UX) 해소를 위해 선행 실행한다.
- 선행 조건: `admin/plan/figmapluginmake.md` 8장의 P1 선행 과제 중 (1) Surface/Slot 확장 스키마 요구사항과 (3) Dry-run 검증 강화 항목을 리팩터링 설계에 반영했음을 확인한다. 추가 구현은 모듈 분리 후 재개한다.
- 실행 순서 및 예상 소요
  1. 준비(P0) — 현 구조 스캔, 샘플/테스트 케이스 확보 (0.5일)
  2. Manifest 모듈화(P1) — `scripts/manifest/*` 작성 및 스키마 검증 (0.5일)
  3. 런타임 분리(P1) — SurfaceConfig/SlotManager/Guardrails/Executor 구성 (1.0일)
  4. UI 상태·컴포넌트 재구성(P2) — Store/Actions/Components 정리 (1.0일)
  5. 테스트·문서·체크포인트(P2) — 단위 테스트, 체크포인트, 문서 동기화 (0.5일)
- 재착수 조건: 각 단계가 끝날 때마다 figmapluginmake P1 수용 기준(증분 갱신, Dry-run 검증)을 다시 실행해 통과해야 하며, 통과 후에만 P1 본 작업(프리뷰 UX 구현)을 재개한다.
- 외부 의존: 최신 `admin/specs/ui-archetypes/**` JSON, pre-commit 메타 스크립트 체인(`scripts/update_frontmatter_time.js → pnpm run validate:docs → pnpm run validate:refs`), 리팩터링 전 스냅샷 커밋을 기준으로 한 롤백 가능 상태.

# 7. 후속 계획

- 리팩터링 완료 후, UI를 React/Preact 기반으로 마이그레이션할지 여부 검토.
- 자동화 테스트 확장(`pnpm --filter plugin test`) 및 CI 통합 계획 수립.

# 7-1. Preact UI 전환 전략(비차단/병행)

- **목표**: WebView UI를 Preact 기반 스캐폴드로 전환해 컴포넌트 단위 책임을 명확히 하고, 런타임 메시지 계약(postMessage DTO) 유지 상태에서 ExecutionPanel·ResultLog를 우선 이관한다.
- **선행 조건**: `pnpm --filter gg-figma-plugin typecheck` 통과(기존 nodeFactory/tokenRegistry 타입 충돌 해결). Manifest/Runtime 모듈 분리 완료(3단계) 상태에서 병행.
- **작업 순서**
  1. **타입 정리** — `src/lib/nodeFactory.ts`, `src/lib/tokenRegistry.ts`의 Figma 타입 충돌을 제거하고 typecheck가 통과하도록 수정.
  2. **의존성 추가** — `pnpm add preact @preact/signals`로 UI 런타임 의존성을 등록하고, `package.json` scripts에 `build:ui`(`pnpm exec tsx scripts/build-ui.ts`)를 연결한다.
  3. **디렉터리 구성** — `src/ui/` 하위에 `index.html`(root div, `<script src="../dist/ui.js">`), `main.tsx`(Preact entry)와 `store/`, `services/`, `components/`를 작성.
     - `store/executionStore.ts`, `store/logStore.ts`, `store/index.ts`
     - `services/io-listener.ts`, `services/execution.ts`
     - `components/ExecutionPanel/index.tsx`, `components/ResultLog/index.tsx`
  4. **최소 구현** — ExecutionPanel에서 Dry-run/Apply 버튼이 `services/execution`을 호출하고, ResultLog는 최근 로그 배열을 렌더링한다. `services/io-listener`는 `useEffect`로 postMessage를 구독.
  5. **번들/엔트리 연결** — `scripts/build-ui.ts`에서 esbuild를 호출해 `src/ui/main.tsx`를 `dist/ui.js`와 `dist/ui.css`로 번들하고, `index.html`을 `ui.html`로 복사하도록 구성(`pnpm exec tsx scripts/build-ui.ts`).
  6. **테스트/검증** — `pnpm --filter gg-figma-plugin build && test && typecheck` 실행. WebView에서 Dry-run 버튼 클릭 시 ResultLog가 즉시 갱신되는지 수동 확인.
  7. **CI 통합** — `.github/workflows/build.yml`에 `gg-figma-plugin build/test/typecheck` 잡을 추가해 Preact UI 회귀 검증을 자동화한다.
- **가드레일**: postMessage DTO, `runSchema*` API, Runtime/Manifest 코드는 변경하지 않는다. WebView 로딩 시 `dist/ui.js`만 교체. 회귀 방지를 위해 기존 구조 테스트(`tests/structure.test.ts`)에 Preact 엔트리 검증 추가.
- **향후 확장**: ExecutionPanel/ResultLog 이후 GuardrailSummary → PreviewControls → RouteTree → Before/After 비교 순으로 이관하며, 각 단계에서 store slice와 components를 분할한다.
- **현황**: 2025-09-30 18:06 UTC / 2025-10-01 03:06 KST — SectionList·SchemaEditor·ExecutionPanel·PreviewControls·ResultLog를 Signals/Preact 구조로 전환하고 RouteTree·routeStore를 추가해 Surface/Slot 선택→Schema 빌드를 연결했다. QuickActions·TargetSelect·Apply 결과 처리·체크포인트 연동은 후속 작업으로 남겨두었다.
- **검증 노트**: ES2017 + inline HTML 번들 방식은 `scripts/build-ui.ts`에서 번들·CSS를 `ui.html`에 삽입하고, CI `plugin-ui` 잡에서 `pnpm --filter gg-figma-plugin build/test/typecheck`로 매 실행 시 검증한다. 로컬 격리 환경에서는 `pnpm --filter gg-figma-plugin build`만으로 동일한 산출물을 생산해야 한다.
