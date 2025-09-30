---
file: admin/plan/figmaplugin-refactor.md
title: Figma Plugin 컴포넌트화 리팩터링 계획
owner: duksan
created: 2025-09-30 06:10 UTC / 2025-09-30 15:10 KST
updated: 2025-09-30 09:13 UTC / 2025-09-30 18:13 KST
status: draft
tags: [plan, figma, refactor]
schemaVersion: 1
description: 플러그인 런타임·UILayer·Manifest 빌더를 기능 단위 모듈로 분리하고 테스트/품질 게이트를 정비하기 위한 리팩터링 로드맵
code_refs:
  [
    'figma-hello-plugin/src/runtime.ts',
    'figma-hello-plugin/src/lib',
    'figma-hello-plugin/src/ui/index.html',
    'figma-hello-plugin/scripts/build-archetype-manifest.js',
  ]
---

# 1. 배경

- DSL/P1 기능이 안정화되면서 런타임과 manifest 빌더, UI 스크립트에 책임이 과도하게 몰려 유지보수 및 디버깅이 어려운 상태다.
- 향후 P2/P3 기능(관찰성, 승인 UX, 테스트 자동화)을 안정적으로 구현하려면 모듈 경계를 명확히 해야 한다.

# 2. 리팩터링 목표

- 런타임, 데이터 파서, UI, 스크립트를 기능별 모듈로 분리하여 단일 책임을 보장한다.
- 모듈 간 인터페이스를 명시화하고 단위 테스트를 추가해 회귀 리스크를 낮춘다.
- 향후 React/Preact 기반 UI 전환 및 CLI/자동화 스크립트 확장을 위한 토대를 만든다.

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

# 4. 작업 순서

1. **준비(P0)**: 현재 manifest/런타임/UITree 사용 패턴 점검, 상호 의존성 정리, 테스트 샘플(json/expected)을 확보한다.
2. **Manifest 모듈화(P1)**
   - `scripts/build-archetype-manifest.js`를 TS 기반 `scripts/manifest/`로 분리(Loader/Builder/Emitter).
   - Surface/Route/Slot 구조 검증 및 JSON Schema 초안 작성.
3. **런타임 분리(P1)**
   - `runtime.ts`를 위에서 정의한 SurfaceConfig/SlotManager/Guardrails/Executor 모듈로 쪼개고, `index.ts`에서 조립.
   - 기존 API(`runSchemaFromString`, `runSchemaBatch`, `runSchemaDocument`)와 메시지 포맷 유지.
4. **UI 분리(P2)**
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

# 6. 일정 및 의존 관계

- 착수 시점: 현재 P1 안정화(DSL/증분 갱신) 완료 후.
- 선행 조건: Surface DSL/Guardrails가 정상 동작하고 주요 버그가 없는 상태.
- P2/P3 기능 개발과 병행하지 않고 짧은 리팩터링 스프린트(약 2~3일)로 수행.

# 7. 후속 계획

- 리팩터링 완료 후, UI를 React/Preact 기반으로 마이그레이션할지 여부 검토.
- 자동화 테스트 확장(`pnpm --filter plugin test`) 및 CI 통합 계획 수립.
