---
file: admin/specs/figma-plugin-p2-variables.md
title: Figma 플러그인 P2 — Variables/Styles 자동 매핑 설계
owner: duksan
created: 2025-09-29 09:32 UTC / 2025-09-29 18:32 KST
updated: 2025-09-29 18:41 UTC / 2025-09-30 03:41 KST
status: draft
tags: [spec, figma, plugin, tokens]
schemaVersion: 1
description: Design Contract 토큰을 기반으로 Figma Variables/Styles를 자동 적용하고 누락을 검출하기 위한 설계/구현 메모
---

# 1. 목표

- JSON 섹션에서 참조하는 토큰(`color.*`, `font.*`, `space.*`, `radius.*`)을 Figma Variables/Styles와 자동 매핑한다.
- 토큰이 존재하지 않거나 모드별 값이 누락된 경우 경고/실패를 출력한다.

# 2. 입력 소스

- Design Contract (`admin/plan/design-contract.md`)에 정의된 토큰 테이블
- Variables/Styles 목록: 플러그인 실행 시 `figma.variables.getLocalVariablesAsync()`와 `figma.getLocalPaintStyles()` 등으로 로드
- 토큰 레지스트리(`tokenRegistry`) JSON (추후 구현 예정)

# 3. 매핑 전략 (구현됨)

1. **이름 규칙 기반 매핑**
   - `color.bg.surface` → Variable/Style 이름 `color/bg/surface`
   - `font.heading.lg` → Text Style `font/heading/lg`
   - 규칙: 토큰 `.` → Figma 스타일 `/`
2. **Fallback 순서**
   - Variables 우선 (light/dark 모드 존재) → Styles → Raw 값 경고
3. **머지 로직**
   - Variables: `node.bindVariable` 또는 `setBoundVariable` 사용
   - Styles: `node.fillStyleId`, `textNode.textStyleId` 등 적용

# 4. 검증 규칙

| 항목        | 기준                        | 조치                     |
| ----------- | --------------------------- | ------------------------ |
| 변수 누락   | 변수 없음                   | 경고 (`missingVariable`) |
| 모드 누락   | light/dark 중 하나 없음     | 경고 (`missingMode`)     |
| Style 누락  | 스타일 없음                 | 경고 (`missingStyle`)    |
| 토큰 미등록 | Design Contract에 없는 토큰 | 실패 (`unknownToken`)    |

# 5. Dry-run 확장

- Dry-run 결과에 `tokenWarnings` 배열 추가: `{ token, issue, nodeId }`
- 경고가 있을 경우 승인 패널에 별도 표시하며 Apply는 가능
- 실패(`unknownToken`) 발생 시 해당 섹션 실행 중단

# 6. 사전 검사

- 플러그인 UI에서 "Variables/Styles 동기화" 버튼 제공
  - 클릭 시 현재 디자인 파일의 Variables/Styles를 스캔해 누락 항목을 리스트업
- 누락 토큰은 csv/json 형태로 내보내 Figma Variables 생성에 활용

# 7. 참고 문서

- `admin/plan/design-contract.md`
- `admin/specs/figmaplugin-p1-design.md`
- `admin/specs/ui-archetypes/README.md`
