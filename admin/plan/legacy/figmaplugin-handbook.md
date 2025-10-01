---
file: admin/plan/legacy/figmaplugin-handbook.md
title: Figma Plugin 공통 규칙 핸드북
owner: duksan
created: 2025-10-01 05:10 UTC / 2025-10-01 14:10 KST
updated: 2025-10-01 16:11 UTC / 2025-10-02 01:11 KST
status: draft
tags: [plan, figma, governance]
schemaVersion: 1
description: 플러그인 설계·Figma·코드가 공유해야 할 공통 규칙과 수용 기준을 정리한 핸드북
doc_refs: ['admin/plan/figmapluginmake.md']
code_refs: []
---

# 1. 목적과 범위

이 문서는 Figma 플러그인 설계 문서, Figma 디자인, 런타임/프런트엔드 코드가 동일한 명세를 따르도록 하기 위한 공통 규칙과 수용 기준을 한 곳에 모았다. 세부 설계는 `admin/plan/figmapluginmake.md`, 실행 계획과 TODO는 `admin/plan/figmaplugin-refactor.md`에서 관리하며, 본 핸드북은 모든 변경의 기준으로 활용한다.

# 2. 용어/Name Contract

1. **공통 용어**: Surface(L1), Route(L2), Slot(L3), Component(L4) 명칭은 문서·Figma 레이어·코드(타입, 스토어, 테스트)에서 동일한 한글/영문 병기 이름을 사용한다.
2. **공식 컴포넌트 레지스트리**: 재사용 컴포넌트는 `COMP:<ComponentName>#<InstanceKey>` 네이밍을 적용하고 Manifest·DSL·Runtime 모두 동일한 값을 유지한다.
3. **검증**: 명명 규칙 불일치, 레지스트리에 없는 이름, 누락된 slot 라벨 감지 시 Guardrail Summary와 ResultLog에 오류를 기록하고 Dry-run/Apply를 중단한다.

# 3. 레이아웃 DSL 규칙

1. **계층 구조**: DSL은 Design Surface → Route → Slot → Section → Component 순으로 중첩된다.
2. **필수 필드**: 각 노드에는 `layout`, `slots`, `tokens`, `idempotentKey`, `op`가 포함되어야 한다.
3. **브레이크포인트**: `sm/md/lg` 오버라이드는 동일한 우선순위 규칙(노드 자체 → 브레이크포인트 override)으로 해석하며 Manifest·Runtime·UI 프리뷰가 일관되게 반영한다.
4. **동시 갱신**: DSL 변경 시 `admin/specs/figmaplugin-p1-design.md`, Manifest 빌더(`scripts/manifest`), 런타임(`surface-config`, `slot-manager`)을 동일 커밋에서 갱신한다.

# 4. 증분 갱신 프로토콜

1. 모든 노드는 `idempotentKey`와 `op: add|update|remove` 값을 갖는다.
2. `pluginData`에는 `schemaVersion`, `slotId`, `layoutHash`, `createdBy`, `timestamp`를 기록한다.
3. Dry-run/Apply는 기존 노드를 삭제하지 않고 패치 방식으로 diff 적용하며, diff 결과는 ResultLog와 체크포인트 Draft에 기록된다.
4. 증분 갱신 실패 시 기존 노드를 원본 상태로 되돌리는 롤백 로직을 Executor/SlotManager에서 제공한다.

# 5. 토큰 거버넌스

1. 색상/타이포/간격은 Variables → Styles → Raw 값 순으로 해석한다.
2. 다크/라이트 모드는 변수 모드 전환만으로 처리하며, 하드코딩 값을 금지한다.
3. 토큰 변경 이력과 변수 모드 전환 정보는 Guardrail Summary와 ResultLog 모두에 남긴다.
4. 토큰 레지스트리 업데이트 시 `admin/plan/design-contract.md`와 Dev Workspace 토큰 표를 동기화한다.

# 6. 관찰성·로그 정책

1. Dry-run/Apply 결과는 Guardrail Summary, ResultLog, 체크포인트 Draft에 동일한 메타데이터(선택된 Surface/Route/Slot/Component, intent, 생성/경고/오류 수치, diff 데이터, payload 해시)를 남긴다.
2. 로그 히스토리는 최대 20개로 유지하며 Undo/Redo가 가능해야 한다. 히스토리 삭제 시에도 감사용 스냅샷은 checkpoint에 남긴다.
3. 실패 시 오류 메시지 템플릿(에러 코드, 사용자 메시지, 재현 payload)을 Guardrail Summary와 ResultLog에 동시에 기록한다.
4. 관찰성 메타는 Dev Workspace 승인 문서와 체크포인트에서 동일한 필드명을 사용한다.

# 7. 트리 UX 및 선택 흐름

1. Surface(L1) 탭 → Route(L2) → Slot(L3) → Component(L4)로 펼침/접힘을 지원한다.
2. 상위 노드 체크 시 하위 전체 선택, 하위 일부 선택 시 상위는 하프 체크 상태가 된다.
3. 선택 상태는 즉시 SectionList, Schema Preview, Execution payload에 반영되며, 불일치 시 실패로 처리한다.
4. 펼침/선택 상태는 `routeStore`·`sectionStore`에 저장하고 ResultLog/체크포인트에 스냅샷을 남긴다.

# 8. 컴포넌트 행동 수용 기준 요약

| 컴포넌트                       | 핵심 규칙                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| RouteTree                      | 계층 구조, 체크박스 동기화, Manifest 라벨/카운트 일치                                          |
| SectionList                    | 트리 선택과 동기화, 검색/필터, 선택 요약 제공                                                  |
| SchemaEditor                   | 선택된 섹션 JSON을 반영, 비교 뷰 제공, 읽기 전용 모드 유지                                     |
| ExecutionControls/TargetSelect | 페이지/프레임/모드 변경 시 payload·Preview·ResultLog에 즉시 반영, Dry-run 성공 후 Apply 활성화 |
| Guardrail Summary              | 메트릭/경고/오류와 추세를 기록, 토큰·레이아웃 감지 결과 노출                                   |
| PreviewControls                | 프레임 포커스·하이라이트·Before/After가 최신 Dry-run 결과와 일치                               |
| QuickActions                   | 선행 조건 검증 후 실행, 성공/실패를 Guardrail Summary·ResultLog·Checkpoint Draft에 공통 기록   |
| ResultLog                      | Slot diff, Guardrail 메타, intent, payload 해시 저장. 20개 히스토리와 Undo/Redo 제공           |
| Checkpoint Draft               | 선택 스냅샷, diff, Guardrail 요약, schemaVersion, 실행 intent를 포함                           |

# 9. 문서/코드 참조

- 설계/비전: `admin/plan/figmapluginmake.md`
- 실행 계획/TODO: `admin/plan/figmaplugin-refactor.md`
- 런타임 구현: `figma-hello-plugin/src/runtime/*`
- UI/스토어: `figma-hello-plugin/src/ui/*`
- Manifest DSL: `figma-hello-plugin/scripts/manifest/*`

필요한 규칙이 추가되면 본 핸드북에 먼저 정의하고, 관련 문서와 코드에서 참조를 갱신한다.
