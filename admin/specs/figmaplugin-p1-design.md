---
file: admin/specs/figmaplugin-p1-design.md
title: Figma 플러그인 고도화 P1 설계안
owner: duksan
created: 2025-09-29 07:50 UTC / 2025-09-29 16:50 KST
updated: 2025-09-29 18:41 UTC / 2025-09-30 03:41 KST
status: draft
tags: [spec, figma, automation, plugin]
schemaVersion: 1
description: P1 범위(컴포넌트 레지스트리, 레이아웃 DSL, 증분 패치, 검증 강화)를 설계해 Codex ↔ Figma 플러그인 파이프라인의 기반을 확정한다.
code_refs: []
doc_refs: ['admin/plan/figmapluginmake.md']
---

# 1. 컴포넌트 레지스트리 & 네이밍 규칙

## 1.1 레지스트리 구조

- JSON 경로: `config/registry/components.json` (향후 저장 위치)
- 루트 키: `version`, `updatedAt`, `components`
- `components[]` 필드
  - `id`: 고유 식별자 (예: `card.standard`)
  - `displayName`: 사용자용 이름 (예: `Card/Standard`)
  - `category`: `section`, `layout`, `widget`, `form` 등 계층 분류
  - `figmaComponentKey`: Figma 컴포넌트 키(필수), Variants는 `variantProperties`에 명시
  - `codeComponent`: 코드 컴포넌트 이름 (예: `Card`), `package`, `importPath`, `props` 포함
  - `slots`: `header`, `body`, `footer` 등 허용 슬롯 정의
  - `tokens`: 필수 디자인 토큰 (예: `color.surface`, `space.md`)
  - `notes`: 사용상 주의/승인 절차 메모

## 1.2 레이어 네이밍 계약

- Figma 레이어 이름 포맷: `COMP:<ComponentId>#<InstanceKey>`
  - `ComponentId`는 레지스트리 `id`를 사용 (소문자+점 구분)
  - `InstanceKey`는 사용자 정의 식별자(예: `hero`, `list-1`)
- JSON 스키마 필드
  - `componentName`: 레지스트리 `id`
  - `instanceKey`: `InstanceKey`
- 플러그인 실행 시 처리
  1. JSON의 `componentName`을 레지스트리에서 조회
  2. 없으면 실행 전 검증에서 오류(`UNKNOWN_COMPONENT`)
  3. 생성된 노드의 `pluginData.codex.componentId`에 `componentName`을 저장, 이름은 규칙에 맞춰 설정
- 코드 싱크
  - 레지스트리는 후속 단계에서 코드 생성 스크립트의 소스가 된다.
  - Dev Workspace에서 컴포넌트 문서를 열 때 레지스트리와 코드 경로를 함께 표시한다.

# 2. 레이아웃 DSL 초안

## 2.1 루트 구조

```json
{
  "schemaVersion": "1.0.0",
  "meta": { "title": "Glossary Dual Pane Layout" },
  "frames": [ { "id": "layout/main", "stack": { ... } } ]
}
```

- 루트 키: `schemaVersion`, `meta`, `frames[]`
- 각 프레임은 `stack`, `grid`, `cluster`, `tokenFrame`, `component` 중 하나의 키를 가진다.

## 2.2 Stack 노드

| 필드          | 설명                                                         |
| ------------- | ------------------------------------------------------------ |
| `direction`   | `vertical` 또는 `horizontal`                                 |
| `gap`         | 토큰 또는 px 값 (`space.md`, `16`)                           |
| `padding`     | `{ top, right, bottom, left }` 토큰/px                       |
| `align`       | `start`, `center`, `end`, `stretch`                          |
| `distribute`  | `start`, `center`, `end`, `space-between`                    |
| `children`    | 하위 노드 배열                                               |
| `breakpoints` | `{ sm: { direction: "vertical" }, lg: { gap: "space.lg" } }` |

## 2.3 Grid 노드

- 필드: `columns`(정수), `rows`(선택), `gutter`, `rowGap`, `columnGap`, `areas`(선택)
- 자식은 `children[]`에 `area` 또는 `span` 정보를 갖고 배치된다.

## 2.4 Component 노드

- 필수 필드: `componentName`, `instanceKey`
- 옵션: `props`, `slots.header`, `slots.body` 등
- 레이아웃 제어를 위해 `size`(`hug`, `fixed`, `fill`), `constraints`를 설정

## 2.5 토큰 참조 규칙

- 토큰 값은 `tokenRegistry` 키(`color.surface/base`,`space.md`)를 우선 사용
- Raw 값 사용 시 `meta.warnings`에 기록해 승인 시 검토하도록 한다.

# 3. 증분 패치 프로토콜

## 3.1 패치 구조

```json
{
  "schemaVersion": "1.0.0",
  "targetFrame": "ROOT_AUTO_WF",
  "ops": [
    { "op": "add", "idempotentKey": "layout/main", "node": { ... } },
    { "op": "update", "idempotentKey": "card/list-1", "diff": { ... } },
    { "op": "remove", "idempotentKey": "section/legacy" }
  ]
}
```

- `idempotentKey`는 JSON과 Figma `pluginData.codex.id`에 동일하게 저장
- `op` 종류
  - `add`: 존재하지 않으면 생성, 있으면 Update로 fallback
  - `update`: Diff를 기반으로 속성만 수정(`layout`, `tokens`, `text` 등)
  - `remove`: Undo를 고려해 대상 노드를 숨긴 뒤 삭제 (옵션)
- 실행 모드
  1. **Dry-run**: Diff 계산 후 요약(생성 N, 갱신 M, 삭제 K, 경고 W)을 UI에 표시
  2. **Apply**: 승인 후 실제 연산 실행, 결과 로그는 `pluginData.codex.history`에 append

## 3.2 메타데이터

- 각 노드 `pluginData.codex` 구조
  - `id`: `idempotentKey`
  - `specHash`: 원본 JSON 해시(SHA-1 8자리)
  - `componentId`: 컴포넌트 레지스트리 id (선택)
  - `updatedAt`: ISO 문자열

# 4. 오류/검증 강화

## 4.1 사전 검증

- 스키마 JSON → Zod 스키마로 검증
- 체크 항목
  - 미등록 컴포넌트 사용 여부
  - 토큰 존재 여부 (`tokenRegistry` 조회)
  - Breakpoint 키 허용 목록(`sm`, `md`, `lg`, `xl`)
  - Raw px 값이 제한 범위(예: 4의 배수)인지
  - `idempotentKey` 중복 여부 및 패턴(`^[a-z0-9\-/]+$`)

## 4.2 실행 중 검증

- 노드 생성 후 Auto Layout 속성이 기대대로 설정됐는지 재검증 (`frame.layoutMode` 등)
- Figma API 호출 실패 시 오류 유형
  - `COMPONENT_NOT_FOUND`
  - `TOKEN_MISSING`
  - `PATCH_CONFLICT` (노드 구조 변경 감지)
- 각 오류는 UI 패널과 `figma.notify`로 요약, 상세 내용은 로그 탭에 표시

## 4.3 로그 & 승인 흐름

- Dry-run → 요약 → 사용자 승인 버튼 (Dev Workspace에서 호출 가능)
- 적용 후 결과는 JSON 형태로 UI에 다운로드 가능(백업 용도)
- Undo 정보: 루트 프레임 아래 `META_PATCH_LOG` 노드에 실행 기록을 남겨 추적한다.

# 5. 후속 작업 포인터 (P2 대비)

- 레지스트리를 실제 JSON 파일로 구현하고, Dev Workspace UI에서 조회/편집 기능을 제공한다.
- DSL 스키마와 패치 프로토콜을 타입 정의(`packages/figma-schema/src`)로 분리해 테스트 가능하게 한다.
- 검증 로직을 유닛 테스트로 커버하기 위해 `pnpm --filter figma-plugin test` 스크립트를 준비한다.
- 섹션 단위 JSON(`admin/specs/ui-archetypes/*/sections/`)을 플러그인에서 읽을 수 있도록 프리셋 로더/트리 UI를 설계한다.
- 플러그인 내부에서 `sections/{order}-{name}.json` 규칙을 파싱해 계층 구조를 생성한다.

## 참고 문서

- `admin/references/figmaplugin/automation-plugins-research.md`
- `admin/references/figmaplugin/figma-plugin-api.md`
- `admin/references/figmaplugin/figma-plugin-samples.md`
- `admin/references/figmaplugin/design-token-tools.md`
- `admin/plan/design-contract.md`
- `admin/specs/ui-archetypes/README.md`
- `admin/specs/ui-archetypes/dashboard/sections/`
