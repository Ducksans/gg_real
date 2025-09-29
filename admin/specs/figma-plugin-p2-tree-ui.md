---
file: admin/specs/figma-plugin-p2-tree-ui.md
title: Figma 플러그인 P2 — 프리셋 트리 UI 설계
owner: duksan
created: 2025-09-29 09:20 UTC / 2025-09-29 18:20 KST
updated: 2025-09-29 18:41 UTC / 2025-09-30 03:41 KST
status: draft
tags: [spec, figma, plugin, ui]
schemaVersion: 1
description: 섹션 단위 JSON 템플릿을 트리 형태로 탐색·선택·실행하기 위한 플러그인 P2 설계안
---

# 1. 목표

- `admin/specs/ui-archetypes/*/sections/` 디렉터리 구조를 플러그인에서 탐색 가능한 트리 UI로 노출한다.
- 사용자가 하나 이상의 섹션 JSON을 선택해 순차적으로 Dry-run/Apply할 수 있도록 한다.
- 섹션 선택 정보가 Dry-run 요약과 승인 프로세스에 반영되도록 한다.

# 2. 파일 구조 파싱 규칙

- 루트: `admin/specs/ui-archetypes/`
- 경로 패턴: `<page>/sections/<order>-<slug>.json`
  - `page`: `dashboard`, `list-filter`, `detail-form`, `timeline-graph` 등
  - `order`: 정수 (실행 순서)
  - `slug`: 소문자+하이픈. UI 표시명은 slug를 Title Case로 변환
- 각 파일의 `meta` 필드( `page`, `section`, `order`, `description` )를 기본 정보로 사용

# 3. 트리 UI 요구 사항

- 좌측: 페이지 목록 (폴더). 우측: 섹션 목록 (체크박스) + 상세 설명
- 섹션 항목 클릭 시 미리보기(텍스트/설명)와 예상 구성요소(컴포넌트 ID) 표시
- 다중 선택 지원: 체크된 섹션을 순서(order) 기준으로 정렬해 실행
- 선택 상태/실행 순서를 상단 요약 영역에 노출 (예: `Dashboard > [00-heading,10-kpi-row,20-recent-list]`)

# 4. 실행 시나리오

1. 사용자가 트리에서 섹션을 선택 → Dry-run 버튼 클릭
2. 플러그인은 선택된 섹션 JSON을 순서대로 병합 또는 순차 실행
3. Dry-run 리포트에 `sections` 키 추가 (예: `{ page: 'dashboard', sections: ['00-heading', '10-kpi-row'] }`)
4. Apply 시 동일 순서로 실행, 실패 시 해당 섹션 ID와 오류 메시지를 표시

# 5. 기술 구현 메모

- 플러그인 UI에서는 파일 목록을 사전 빌드된 매니페스트(JSON)로 로드하거나, Node.js 런타임에서 읽어 `ui.html`에 전달
- 트리 상태 관리를 위해 React(또는 Svelte) 컴포넌트 사용 → 체크 상태, 순서, 선택 요약
- Dry-run 요청 payload 예시:
  ```json
  {
    "schemaVersion": "1.0.0",
    "page": "dashboard",
    "sections": ["dashboard/sections/00-heading.json", "dashboard/sections/10-kpi-row.json"],
    "mode": "dry-run"
  }
  ```
- 순차 실행 시 각 섹션의 결과를 배열로 수집해 최종 리포트 생성
- 현재 구현: `scripts/build-archetype-manifest.js`가 아키타입 디렉터리를 스캔해 `src/lib/archetype-manifest.ts`를 생성하고, UI는 해당 데이터를 사용해 트리를 렌더링한다.

## 5.1 섹션 병합 전략

- 기본: **순차 append** — 각 섹션 JSON을 독립 schemaDocument로 변환해 순서대로 실행
- 옵션:
  - `combine = frame`: 동일 `target.frameName`을 지정한 섹션끼리 하나의 프레임으로 병합
  - `combine = append`: 섹션마다 새 프레임 생성 (페이지 내 다중 프레임 허용)
- 플러그인 설정 UI에서 `결합 방식`을 선택하도록 옵션 추가 예정

# 6. UX/에러 처리 및 승인 흐름

- 파일 없음 / 메타 정보 누락 → 선택 불가 상태와 경고 표시
- 임계치 초과(노드 수, 중첩 레벨 등) → 즉시 경고. 필요 시 체크박스 비활성화
- 실행 중 에러 → Dry-run 리포트에 `errors[]` 항목 추가 (섹션 ID 포함)

## 6.1 섹션 크기/중첩 임계치

| 항목                | 임계치 | 동작                     |
| ------------------- | ------ | ------------------------ |
| `nodeCount`         | 120    | 경고 (Continue / Cancel) |
| `nodeCount`         | 200    | 실패 (섹션 실행 차단)    |
| `depth` (중첩 레벨) | 6      | 경고                     |
| `depth`             | 8      | 실패                     |
| `fileSize`          | 40KB   | 경고                     |
| `fileSize`          | 80KB   | 실패                     |

- 경고 시 UI에 "섹션이 복잡합니다. 분할을 권장합니다." 메시지 노출
- 실패 시 해당 섹션 체크박스를 비활성화하고 상세 이유 표시
- Dry-run 리포트에 `warnings`/`errors` 항목으로 가드레일 위반 내역 기록

## 6.2 관찰성 & 승인 UX 연동

- Dry-run 결과는 Dev Workspace 우측 패널에 `page`, `sections`, `metrics`, `warnings`, `errors` 5가지 블록으로 표시한다.
- 섹션별 상태 아이콘: 완료 ✓, 경고 !, 실패 ✕
- 승인 흐름
  1. Dry-run → 결과 요약 → 사용자 승인 버튼 노출
  2. 승인 시 선택된 섹션 목록과 specHash를 포함해 체크포인트 초안 자동 생성
  3. Apply 완료 후, 결과 요약(생성/갱신/삭제 수치)과 경고를 Dev Workspace와 Figma Notify 양쪽에 전달
- 로그 저장: `pluginData.codex.history`에 `{ sectionId, result, executedAt }` 레코드 추가

# 7. 향후 확장

- 섹션 미리 보기 이미지/썸네일 지원
- 사용자 정의 섹션(빠른 수정)을 업로드/추가하는 기능
- 섹션 템플릿 버전 관리(`@v1`, `@v2`)를 트리에 표시하고 선택 가능하게 함

# 8. 참고 문서

- `admin/plan/figmapluginmake.md`
- `admin/plan/design-contract.md`
- `admin/specs/ui-archetypes/README.md`
