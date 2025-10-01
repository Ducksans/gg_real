---
file: admin/plan/figmaplugin-runtime-investigation.md
title: Figma Runtime 오류 재현 및 UI 안정화 계획
owner: duksan
created: 2025-10-01 07:33 UTC / 2025-10-01 16:33 KST
updated: 2025-10-01 12:31 UTC / 2025-10-01 21:31 KST
status: in_progress
tags: [plan, figma, runtime, qa]
schemaVersion: 1
description: 실제 Figma 환경에서 발생하는 JSON 파싱 오류와 UI 겹침 문제를 재현하고 해결하기 위한 단계별 전략과 manifest/schema 검증 절차.
doc_refs: ['admin/plan/figmapluginmake.md', 'admin/plan/figmaplugin-roadmap.md']
code_refs:
  [
    'figma-hello-plugin/scripts/runtime/save-sample.ts',
    'figma-hello-plugin/src/ui/store/routeStore.ts',
    'figma-hello-plugin/src/ui/store/sectionStore.ts',
    'figma-hello-plugin/tests/ui-route-store.test.ts',
  ]
---

# 1. 목적

1. Dry-run 단계에서 보고된 JSON 파싱 오류와 RouteTree(트리 형태 UI) 겹침 현상을 재현하고 원인을 좁힌다.
2. SlotManager(슬롯 구조를 실제 Figma 프레임으로 연결하는 모듈)와 Execution 파이프라인의 관찰 지점을 정리하여 추적 시간을 단축한다.
3. manifest 산출물과 schema 정의의 정합성을 재확인해, 실제 Figma에서 받은 JSON을 그대로 실행할 수 있는지 검증한다.

# 2. 현재 증상 정리

1. Dry-run 중 JSON 문자열을 실제 Figma 환경에서 파싱할 때 `JSON.parse` 단계에서 에러 메시지가 발생했다는 보고가 있다.
2. RouteTree UI에서 노드가 겹쳐 보이거나 스크롤이 꼬이는 현상이 관측되었으며, Dry-run → Apply 흐름과 선택 상태가 일치하지 않는 사례가 있다.
3. 로컬 테스트(`pnpm --filter gg-figma-plugin test`, `typecheck`)는 성공했지만 Figma에서 내려받은 실제 JSON 샘플이 manifest/schema와 다듬어지지 않았을 가능성이 존재한다.

# 3. [P1] Dry-run JSON 파싱 오류 추적 계획

1. 증상 캡처: Dry-run 실패 시 ResultLog에 자동으로 생성되는 캡처 ID·미리보기·정규화 여부를 확인하고, 콘솔에 출력되는 `[plugin:raw-capture]` 로그를 함께 저장한다.
2. 재현 데이터 준비: 콘솔 안내에 따라 `pnpm --filter gg-figma-plugin save:runtime-sample --id <capture-id>` 명령을 실행해 JSON을 `admin/samples/runtime/`에 기록한다. 저장 전 `scripts/manifest/validator.ts`의 AJV 검증 함수를 CLI에서 호출해 스키마 위반 여부를 먼저 확인한다.
3. 파이프라인 분리 실행: `runSchemaFromString` → `runSchemaDocument` → `syncSlotChildren`까지 단계별로 try/catch를 추가해 어떤 지점에서 JSON이 파싱되는지 추적한다. 예외 메시지를 `notifyError`뿐 아니라 `profileSlotManager`에도 전달해 로그를 통합한다.
4. 특수문자 검사: dry-run JSON에 포함된 제어문자나 BOM(Byte Order Mark) 여부를 검사한다. `validator.ts`에 `ajv-formats`의 `byte` 포맷을 활용하거나, `loader.ts` 단계에서 `raw.replace(/\uFEFF/g, '')` 같은 전처리를 옵션으로 제공한다.
5. Figma API 의존성 검증: `normalizeTarget`와 `decorateWithMetadata` 단계에서 Figma 환경 객체(figma)를 요구하므로, dry-run 전용 모의 객체(mock)가 누락되지 않았는지 확인한다. 필요 시 `src/runtime/executor/context-factory.ts`에서 dry-run 플래그를 체크해 안전한 기본값을 주입한다.
6. 재현 확인: 상기 조치 후 동일 JSON으로 dry-run을 반복 실행하고, 오류가 재현되면 해당 JSON과 로그를 `admin/checkpoints/` 설명에 링크한다.

# 4. [P2] RouteTree UI 겹침 및 계층 동기화 계획

1. 레이아웃 점검: RouteTree는 `src/ui/components/RouteTree/RouteTree.tsx`와 `SlotNode.tsx`에서 렌더링한다. AutoLayout에 해당하는 CSS(`src/ui/styles/app.css`)에서 flex 방향과 간격 변수를 manifest 슬롯 정의(`surface-config`)와 비교해 누락된 부분을 찾는다.
2. 상태 스토어 일관성: 선택 상태는 `routeStore`와 `sectionStore` Signals에 저장된다. Dry-run 이후 `executionStore`가 선택된 섹션 배열을 업데이트할 때 RouteTree에 반영되는지 `src/ui/store/index.ts`의 파생 시그널을 통해 확인한다.
3. 스크롤/겹침 재현: 실제 Figma UI에서 RouteTree 컨테이너 높이가 변하지 않는지, `overflow-y` 설정이 적절한지 확인한다. 필요한 경우 SlotManager에서 전달하는 `slotId`에 맞춰 UI에 padding 정보를 반영한다.
4. 계층 노출: RouteTree가 Surface → Route → Slot → Section 4단계를 그대로 표시하고, 슬롯·섹션 체크박스가 `sectionStore`와 동기화되도록 유지한다.
5. 테스트 강화: 신규로 작성한 `tests/runtime-surface-config.test.ts` 데이터를 UI 스토어에서도 재사용할 수 있게 `@runtime/surface-config/normalizer` 결과를 UI 선택 패널의 단위 테스트에 주입하는 방안을 마련한다.
6. 수용 기준 정리: `admin/plan/figmapluginmake.md`의 트리 UX 조건(체크박스 동기화, 하프 체크 등)을 체크리스트로 변환해 실제 RouteTree 구현에서 하나씩 검증한다.

# 5. [P3] manifest · schema 정합성 검증 절차

1. 스키마 재검증: `pnpm --filter gg-figma-plugin build:manifest`를 실행해 `src/lib/archetype-manifest.ts`를 재생성한 뒤, `scripts/manifest/validator.ts`가 모든 surface/section JSON에 대해 오류 없이 동작하는지 확인한다.
2. 문서 교차 확인: `admin/plan/figmaplugin-terminology.md`의 용어 이름이 manifest `label` 필드와 일치하는지 확인하고, 불일치 시 용어 문서를 우선 수정한다.
3. 샘플 JSON 적용: Figma에서 받은 원본 JSON을 `scripts/manifest/normalizer.ts`에 도입된 정규화 함수에 통과시켜 변환 결과가 `SchemaDocument` 타입(`src/schema.ts`) 기준에 맞는지 검사한다.
4. 단위 테스트: `pnpm --filter gg-figma-plugin test`와 `typecheck`를 실행해 Runtime/Schema가 동시에 유효한지 재확인하고, 실패할 경우 실패 케이스를 README/체크포인트에 기록한다.
5. 결과 기록: 검증 성공 시 `admin/checkpoints/` 신규 파일에 실행한 명령, 검증한 JSON 이름, 발견된 문제를 요약한다.

# 6. 로그·체크포인트·GitHub 연동

1. 각 단계에서 수집한 로그와 재현 JSON은 `admin/checkpoints/`와 `admin/samples/runtime/`에 저장하고, 파일명을 Roadmap ID(TODO-P1-03 등)와 맞춘다.
2. 중대한 변경 후에는 "깃 허브에 동기화 할까요?" 절차를 따르며, 커밋 메시지는 `[figma-runtime]` 접두사를 사용한다.
3. Dry-run 문제 해결 시 `admin/plan/figmaplugin-roadmap.md`의 해당 행(예: TODO-P1-03, TODO-P2-01)을 업데이트해 상태와 종료 시각을 기록한다.

# 7. 향후 일정 제안

1. 2025-10-01 ~ 2025-10-02: Dry-run 오류 재현 및 로그 수집.
2. 2025-10-02 ~ 2025-10-03: UI 겹침 수정안 프로토타입 구현 및 단위 테스트 추가.
3. 2025-10-03 이후: manifest/schema 정합성 점검 결과를 바탕으로 Figma 실 환경에서 리그레션 테스트 수행.
