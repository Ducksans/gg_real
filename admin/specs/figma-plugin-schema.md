---
file: admin/specs/figma-plugin-schema.md
title: Figma 자동 생성용 JSON 스키마 초안
owner: duksan
created: 2025-09-29 02:58 UTC / 2025-09-29 11:58 KST
updated: 2025-09-29 03:57 UTC / 2025-09-29 12:57 KST
status: draft
tags: [schema, figma, plugin, automation]
schemaVersion: 1
description: Codex가 Figma 플러그인으로 전달할 레이아웃 명령 JSON의 구조와 필수 필드를 정의한 초안
linkedPlans:
  - admin/plan/figmapluginmake.md
  - admin/plan/devworkspace.md
---

# 1. 스키마 개요

- **목적**: Codex가 산출한 UI 명세(JSON)를 Figma 플러그인이 받아 동일한 구조로 프레임/컴포넌트를 생성하도록 한다.
- **버전 관리**: `schemaVersion` 필드(예: `1.0.0`)를 최상위에 배치하고, 향후 변경 시 마이그레이션 로직을 준비한다.
- **기본 규칙**
  - 모든 노드는 `type` 필드를 갖는다. 허용 타입: `frame`, `stack`, `text`, `component`, `vector`, `image`, `spacer`.
  - 자식 노드가 있는 요소는 `children: []` 배열을 포함한다.
  - 스타일은 토큰(`tokens.color.primary`) 또는 직접 값(`rgba`, `fontSize`)으로 지정 가능하며, 토큰 우선 적용.
  - 치수/여백 단위는 px 기준 숫자. auto-layout 속성은 Figma naming(`layoutMode`, `primaryAxisAlignItems`) 사용.

# 2. 루트 구조

```json
{
  "schemaVersion": "1.0.0",
  "meta": {
    "title": "Glossary Split Layout",
    "description": "위키 본문 + 보조 본문 2분할",
    "createdBy": "codex",
    "tokenset": "gg_real/base"
  },
  "target": {
    "page": "GG_real_admin",
    "frameName": "WikiGlossaryLayout",
    "mode": "replace" // replace | append | update
  },
  "nodes": [
    /* Node objects */
  ]
}
```

# 3. 노드 정의

| 타입        | 필수 필드                              | 선택 필드                                                          | 비고                                                                    |
| ----------- | -------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `frame`     | `name`, `size`                         | `fills`, `strokes`, `cornerRadius`, `layout`, `tokens`, `children` | 독립 프레임. auto-layout 미사용 기본값                                  |
| `stack`     | `name`, `layout.direction`, `children` | `size`, `padding`, `spacing`, `layout.align`, `tokens`             | auto-layout 전용 컨테이너, 생성 시 `createFrame` + `layoutMode` 값 적용 |
| `text`      | `name`, `text.content`                 | `text.style`, `tokens`, `constraints`                              | 폰트 미지정 시 프로젝트 기본값                                          |
| `component` | `name`, `componentKey`                 | `overrides`, `size`, `tokens`                                      | Figma 라이브러리 인스턴스 생성                                          |
| `vector`    | `name`, `pathData`                     | `fills`, `strokes`, `tokens`                                       | 간단한 아이콘/선                                                        |
| `image`     | `name`, `imageRef`                     | `size`, `cornerRadius`, `tokens`                                   | `imageRef`는 플러그인 `createImageAsync` 입력                           |
| `spacer`    | `name`, `size`                         | `layout.grow`                                                      | 레이아웃 전용 빈 요소                                                   |

## 3.1 공통 속성

```json
{
  "name": "MainContainer",
  "size": { "width": 1200, "height": 720 },
  "tokens": {
    "fill": "color.surface",
    "text": "color.on-surface"
  },
  "constraints": {
    "horizontal": "LEFT_RIGHT",
    "vertical": "TOP_BOTTOM"
  },
  "pluginData": {
    "docId": "wiki-glossary",
    "section": "primary"
  }
}
```

- `tokens`: 디자인 토큰 이름 → 실제 값 매핑용. 플러그인은 토큰 테이블을 조회해 적용.
- `constraints`: Figma `LayoutConstraint` 값 그대로 사용.
- `pluginData`: Codex/Audit 로그용 메타.

## 3.2 레이아웃 속성(`layout`)

```json
"layout": {
  "type": "auto",         // auto | absolute
  "direction": "VERTICAL", // VERTICAL | HORIZONTAL
  "primaryAlign": "START", // START | CENTER | END | SPACE_BETWEEN
  "counterAlign": "START", // 상호 축 정렬
  "padding": { "top": 32, "right": 32, "bottom": 32, "left": 32 },
  "spacing": 24,
  "grid": {
    "columns": 12,
    "gutter": 24,
    "margins": 160
  }
}
```

# 4. 텍스트/스타일 정의

```json
"text": {
  "content": "용어집",
  "style": {
    "font": { "family": "Pretendard", "style": "Bold" },
    "fontSize": 28,
    "lineHeight": 36,
    "letterSpacing": 0,
    "textCase": "UPPER",
    "textDecoration": "NONE"
  }
}
```

- `style` 내 값이 비어 있으면 토큰/기본값 사용.
- `tokens.typography.heading.lg` 형태로 대체 가능 → 토큰 테이블에 `font`, `size`, `lineHeight` 매핑.

# 5. 토큰 매핑 전략 초안

| 토큰 prefix | 설명                  | Figma 적용 대상                  |
| ----------- | --------------------- | -------------------------------- |
| `color.*`   | 배경/텍스트/보더 컬러 | `fills`, `strokes`               |
| `space.*`   | 간격/패딩 단위        | `padding`, `spacing`             |
| `radius.*`  | 모서리 곡률           | `cornerRadius`                   |
| `typo.*`    | 타이포 스타일         | `font`, `fontSize`, `lineHeight` |
| `effect.*`  | 그림자/블러           | `effects`                        |

- 토큰 테이블은 `figma-hello-plugin/data/tokens.json` (향후 추가)로 관리.
- 토큰을 찾지 못하면 로그에 경고 후 기본값을 사용.

# 6. 샘플 JSON (요약)

```json
{
  "schemaVersion": "1.0.0",
  "meta": { "title": "Glossary Reader" },
  "target": { "page": "GG_real_admin", "frameName": "GlossaryLayout", "mode": "replace" },
  "nodes": [
    {
      "type": "frame",
      "name": "GlossaryLayout",
      "size": { "width": 1440, "height": 900 },
      "tokens": { "fill": "color.surface.base" },
      "layout": {
        "type": "auto",
        "direction": "HORIZONTAL",
        "primaryAlign": "START",
        "counterAlign": "STRETCH",
        "padding": { "top": 32, "right": 32, "bottom": 32, "left": 32 },
        "spacing": 24
      },
      "children": [
        {
          "type": "stack",
          "name": "PrimaryColumn",
          "layout": {
            "type": "auto",
            "direction": "VERTICAL",
            "spacing": 16
          },
          "size": { "width": 880, "height": 836 },
          "tokens": { "fill": "color.surface.card", "radius": "radius.lg" },
          "children": [
            {
              "type": "text",
              "name": "Heading",
              "text": { "content": "용어 상세", "style": { "token": "typo.heading.lg" } },
              "tokens": { "text": "color.text.primary" }
            },
            {
              "type": "component",
              "name": "GlossaryBody",
              "componentKey": "3ac3b16db64ce5bb6df3ac11b6f0a6c9",
              "overrides": {
                "Description": "텍스트 내용"
              }
            }
          ]
        },
        {
          "type": "stack",
          "name": "SecondaryColumn",
          "layout": {
            "type": "auto",
            "direction": "VERTICAL",
            "spacing": 12
          },
          "size": { "width": 432, "height": 836 },
          "tokens": { "fill": "color.surface.card" },
          "children": [
            { "type": "text", "name": "Hints", "text": { "content": "관련 용어" } },
            { "type": "spacer", "name": "Spacer", "size": { "height": 1 }, "layout": { "grow": 1 } }
          ]
        }
      ]
    }
  ]
}
```

# 7. 검증 체크리스트 (초안)

- [ ] `schemaVersion`이 지원 범위인지 확인.
- [ ] `nodes` 배열의 루트 노드는 `frame` 또는 `stack`.
- [ ] 각 노드 `name`은 페이지 내에서 유일하도록 보정.
- [ ] 토큰 참조 시 `tokens.json`에 존재하는지 검증하고, 미존재 시 fallback 적용.
- [ ] `componentKey` 사용 시 플러그인 실행 전에 대상 라이브러리가 열려 있는지 확인.
- [ ] 이미지/벡터 asset은 base64 또는 URL을 통해 로드 가능하도록 사전 준비.

# 8. 다음 단계

1. 스키마 초안을 바탕으로 TypeScript 타입 정의 생성 (`src/schema.ts`).
2. 샘플 JSON을 이용한 파서/생성 테스트 작성.
3. 토큰 테이블 구조 및 기본값 정의.
