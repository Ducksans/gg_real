---
file: admin/plan/design-contract.md
title: 관리자 UI 설계 계약(Design Contract)
owner: duksan
created: 2025-09-29 08:07 UTC / 2025-09-29 17:07 KST
updated: 2025-09-29 18:41 UTC / 2025-09-30 03:41 KST
status: draft
tags: [plan, design, contract, ui]
schemaVersion: 1
description: 관리자 페이지 전 화면을 대상으로 테마·토큰·레이아웃·컴포넌트·승인 규칙을 고정해 Figma 플러그인과 코드 구현을 일관되게 만드는 설계 계약서
code_refs: []
doc_refs: ['admin/specs/figmaplugin-p1-design.md', 'admin/plan/figmapluginmake.md']
---

# 0. 목적과 범위

- **목표**: 문서 → 시각화(Figma) → 코딩(React) 전 과정에서 동일한 규칙을 적용해 재작업과 회귀를 방지한다.
- **적용 화면**: 관리자 대시보드, 그래프, 위키, 타임라인, 에이전트, 워크플로우 등 관리자 탭 전체.
- **품질 게이트**: 본 계약서의 체크리스트를 충족하지 않은 화면은 개발 단계로 진입하지 않는다.

# 1. 테마 및 색상 계약

## 1.1 테마 모드

- 지원 모드: `light`, `dark` (필수)
- 전환 방식: Figma Variables 모드 토글만 사용, 하드코딩 금지
- 대비 기준: 본문 텍스트 대비 4.5:1 이상, 제목/아이콘은 3:1 이상

## 1.2 색상 토큰 계층

- Semantic → Reference → 실제 HEX 순으로 정의
- 핵심 토큰 (예시)
  - `color.bg.surface`, `color.bg.elevated`
  - `color.text.primary`, `color.text.secondary`
  - `color.brand.primary`, `color.brand.secondary`
- 상태 색상 5종: `success`, `info`, `warning`, `danger`, `neutral` (배경/테두리/텍스트 조합 포함)
- 데이터 시각화: 범주형 팔레트 최소 8색, 연속형 최소 3단계 제공
- 금지: Raw HEX 직접 입력, 토큰 미지정 색상 사용

## 1.3 테마 검증 체크리스트

- [ ] 모든 노드가 토큰(`tokenRegistry`)을 통해 색상을 지정한다.
- [ ] 대비 검사 보고서(WCAG) 첨부
- [ ] 다크 모드에서 채도/명도 보정 규칙을 적용했다.

# 2. 타이포그래피 계약

## 2.1 역할별 스타일

| 역할      | 토큰              | 크기(px) / 행간(px) | 용도             |
| --------- | ----------------- | ------------------- | ---------------- |
| Display   | `font.display`    | 32 / 40             | 대시보드 큰 제목 |
| Heading 1 | `font.heading.lg` | 24 / 32             | 페이지 제목      |
| Heading 2 | `font.heading.md` | 20 / 28             | 섹션 제목        |
| Heading 3 | `font.heading.sm` | 18 / 26             | 카드 제목        |
| Body      | `font.body`       | 14 / 22             | 본문 텍스트      |
| Caption   | `font.caption`    | 12 / 18             | 보조 설명        |
| Mono      | `font.mono`       | 13 / 20             | 코드/수치 표시   |

## 2.2 작성 규칙

- 제목은 문장형, 본문은 좌측 정렬 기본
- 링크: 밑줄 + `color.text.link` 고정, 방문 상태 색상 정의
- 국문 가독성: Body 이상 14/22 이상, 자간 0~2, 행간 1.6 배수
- 텍스트 스타일은 Variables/Styles로만 지정, 인라인 서식 금지

## 2.3 검증 체크리스트

- [ ] 모든 텍스트가 표의 토큰 중 하나를 사용한다.
- [ ] 제목/본문의 스타일이 Figma 스타일 라이브러리와 동기화됐다.

# 3. 공간·레이아웃·반응형 규칙

## 3.1 스페이싱 & 라운드

- 스페이싱 스케일: 4의 배수 (4, 8, 12, 16, 24, 32, 48, 64)
- 코너 반경: `radius.sm`=4, `radius.md`=8, `radius.lg`=12, `radius.xl`=16
- 그림자/블러는 토큰으로 관리 (`shadow.card`, `shadow.nav` 등)

## 3.2 레이아웃 DSL 기본 규칙

- 절대 좌표는 금지. 모든 배치는 `stack`, `grid`, `cluster`, `slot`으로 표현
- Stack 필드: `direction`, `gap`, `align`, `distribute`, `padding`
- Grid 필드: 열 수(`columns`), `gutter`, `rowGap`, `columnGap`, `span`
- 슬롯: 컴포넌트 내부 영역(`header`, `body`, `footer`, `sidebar`, `toolbar`)

## 3.3 반응형(Breakpoints)

| 키   | 기준(px) | 특징                     |
| ---- | -------- | ------------------------ |
| `sm` | 640      | Drawer/Bottom Sheet 중심 |
| `md` | 768      | 1~2열 레이아웃           |
| `lg` | 1024     | 기본 12열, 사이드바 적용 |
| `xl` | 1280     | 고밀도 대시보드          |

- 오버라이드 규칙: `breakpoints.sm.gap = 'space.md'`처럼 DSL에서 지정
- 내비게이션: `md` 미만 Drawer, `lg` 이상 Persistent Sidebar
- 테이블: `sm`에서 중요 열만 유지, 나머지는 Row-expand 또는 Badge 요약

## 3.4 검증 체크리스트

- [ ] JSON DSL 상에 절대 좌표 항목이 없다.
- [ ] 모든 breakpoints 값이 허용 키(`sm`, `md`, `lg`, `xl`) 중 하나다.
- [ ] Stack/Grid gap/padding이 스페이싱 스케일을 사용한다.

# 4. 컴포넌트 카탈로그 & 이름 계약

## 4.1 공식 컴포넌트 목록(발췌)

| 카테고리   | 컴포넌트 ID           | 슬롯                                      | 상태                            |
| ---------- | --------------------- | ----------------------------------------- | ------------------------------- |
| Layout     | `section.header`      | `leading`, `actions`                      | default                         |
| Content    | `card.standard`       | `header`, `body`, `footer`                | default, hover, selected        |
| Data       | `table.standard`      | `toolbar`, `head`, `rows`, `pagination`   | loading, empty, error           |
| Data       | `pagination.standard` | `controls`                                | default, disabled               |
| Navigation | `nav.sidebar`         | `items`, `footer`                         | collapsed, expanded             |
| Feedback   | `alert.inline`        | `icon`, `content`, `actions`              | info, success, warning, danger  |
| Feedback   | `empty.state`         | `icon`, `title`, `description`, `actions` | default                         |
| Graph      | `chart.timeline`      | `header`, `canvas`, `legend`              | loading, empty                  |
| Graph      | `legend.inline`       | `items`                                   | default                         |
| Timeline   | `timeline.vertical`   | `events`                                  | default                         |
| Toolbar    | `toolbar.filter`      | `filters`                                 | default                         |
| Toolbar    | `toolbar.bulkActions` | `actions`                                 | default                         |
| Filter     | `filter.panel`        | `filters`                                 | default                         |
| Form       | `form.row`            | `label`, `input`, `hint`                  | default, focus, error           |
| Form       | `form.layout`         | `fields`                                  | default                         |
| Button     | `button.primary`      | —                                         | default, hover, focus, disabled |
| Button     | `button.secondary`    | —                                         | default, hover, focus, disabled |
| Button     | `button.tertiary`     | —                                         | default, hover, focus, disabled |

- 컴포넌트 ID는 `카테고리.이름` 패턴, 코드도 동일한 PascalCase 사용(예: `CardStandard`)
- 레이어 이름: `COMP:<ComponentId>#<InstanceKey>`
- 플러그인 생성 시 `pluginData.codex.componentId`에 ID 저장
- 상태는 `default`, `hover`, `focus`, `active`, `disabled`, `loading`, `error`, `empty` 최소 지원

## 4.2 금지/경고 규칙

- 금지: 레지스트리에 없는 컴포넌트 ID 사용
- 경고: 슬롯 미지정, 상태 변형 누락

## 4.3 검증 체크리스트

- [ ] JSON 스키마의 `componentName`이 레지스트리 ID와 일치한다.
- [ ] 레이어 이름이 `COMP:...` 규칙을 따른다.
- [ ] 상태별 스타일이 문서화되어 있다.

# 5. 상호작용·모션·아이콘

## 5.1 포커스 & 키보드

- 포커스 링: 색상 `color.focus.ring`, 두께 2px, 오프셋 2px
- Tab 순서: 좌→우→하 방향, Skip Link 제공(헤더 최상단)
- 키보드 운영: Drawer/Modal은 ESC 닫기, Enter 기본 액션

## 5.2 모션 규약

- 전환 시간: 120–200ms (ease-out, ease-in-out)
- 적용 범위: Drawer/Modal, Hover, 상태 변경. 과도한 애니메이션 금지

## 5.3 아이콘 규약

- 아이콘 세트: 단일 라이브러리(Lucide 등) 고정
- 크기 스케일: 16/20/24, Stroke 두께 1.5 또는 2
- 이미지: 비율 유지, 라운드/그림자 토큰만 허용

# 6. 접근성(A11y)·국제화·콘텐츠

## 6.1 접근성

- ARIA 역할: 컴포넌트별 표 (예: `nav.sidebar` → `role="navigation"`, `aria-label` 필수)
- 색각 보정: 색상 정보만 제공 금지, 아이콘/텍스트 병행
- 오류 메시지: 텍스트 + 아이콘, 해결 방법 제시

## 6.2 국제화·단위

- 모든 텍스트는 design annotation에 문자열 키를 병기 (예: `i18n:dashboard.summary.title`)
- 날짜/숫자는 KST 기준, UI에서는 사용자 로케일 고려(문서에서 규칙 명시)
- 단위 표기: m², %, 원 등 표준화된 단위 사용

## 6.3 UX Writing

- 톤: 관리자용 중립체, 간결한 명령문
- 문장 규격: 헤드라인 1줄, 보조 설명 2줄 이하, 버튼은 동사+목적어

# 7. 승인·관찰성·버전

## 7.1 증분 패치 & Dry-run

- 패치 형식: `op`(`add`, `update`, `remove`), `idempotentKey`, `diff`
- Dry-run 리포트: `created`, `updated`, `removed`, `warnings` 수치와 대상 리스트
- 승인 플로: Dry-run → 사용자 검토 → 승인 → 적용 → 요약 아카이브

## 7.2 메타데이터 저장

- `pluginData.codex`
  - `id`: `idempotentKey`
  - `componentId`: 레지스트리 ID
  - `schemaVersion`: SemVer 문자열
  - `specHash`: 설계안 해시(8자)
  - `createdBy`, `appliedAt`: ISO8601 문자열
  - `devResource`: 관련 코드/문서 링크

## 7.3 버전 정책

- 계약 문서/플러그인/코드는 동일 `schemaVersion`을 따른다.
- Major 버전 업 시 하위 호환 불가, 마이그레이션 가이드 필수 첨부.

# 8. 페이지 아키타입 템플릿

## 8.1 공통 항목

- 필수 구성: 레이아웃 구조, 주요 컴포넌트, 상태 화면, 반응형 사례, 접근성 체크, 승인 로그
- 합격 기준(DoD)
  1. Archetype 정의(대시보드/목록/상세/폼/그래프 등)
  2. Stack/Grid DSL 완성, span/gap 명시
  3. 토큰/타이포/색상 검증 통과
  4. `sm/md/lg` 시안 또는 캡처 포함
  5. 상태 화면 4종(loading/empty/error/permission) 포함
  6. 키보드 포커스 흐름/ARIA 라벨 명시
  7. 컴포넌트 이름과 레지스트리 ID 일치

## 8.2 Archetype 예시 (발췌)

- **대시보드**: `grid 12 cols`, 카드 span 4/6/12, 헤더 Quick Actions 포함
- **목록+필터**: 상단 Filter Toolbar, 테이블 span 전체, 빈 상태 가이드 필요
- **상세+폼**: 좌측 정보 카드, 우측 탭/필드, 저장/취소 버튼 고정
- **타임라인/그래프**: 상단 범례/필터, 본문 그래프 캔버스, 하단 이벤트 리스트

# 9. 거버넌스 & 변경 관리

- 변경 절차: 제안 → 검토(디자인/Dev Workspace/플러그인) → 승인 → 체크포인트 기록
- 문서 수정 시 `updated` 시간 갱신, 변경 로그(섹션 11)에 기록
- 긴급 변경은 Hotfix 문서로 기록 후 본 계약서에 병합

# 10. 린트/검증 포맷 합의

- **Lint 결과 JSON**
  - `errors[]`: `{ code, message, nodeId }`
  - `warnings[]`: `{ code, message, nodeId }`
  - `summary`: `{ totalErrors, totalWarnings }`
- **Dry-run 리포트 JSON**
  - `created[]`, `updated[]`, `removed[]`, `warnings[]`
  - `metrics`: `{ created, updated, removed, warnings }`
  - `schemaVersion`, `specHash`

# 11. 버전/변경 로그

| 날짜 (UTC/KST)                              | 버전  | 변경자 | 주요 변경                             |
| ------------------------------------------- | ----- | ------ | ------------------------------------- |
| 2025-09-29 08:07 UTC / 2025-09-29 17:07 KST | 0.1.0 | duksan | 초기 초안 작성 (테마~페이지 DoD 정의) |

# 12. 참고 문서

- `admin/specs/figmaplugin-p1-design.md`
- `admin/plan/figmapluginmake.md`
- `admin/plan/devworkspace.md`
- `admin/references/figmaplugin/README.md`
- `admin/references/figmaplugin/automation-plugins-research.md`
- `admin/references/figmaplugin/figma-plugin-api.md`
- `admin/references/figmaplugin/figma-plugin-samples.md`
- `admin/references/figmaplugin/design-token-tools.md`

# 13. 다음 단계(추천)

1. 각 페이지 아키타입 별 DSL 샘플 JSON 생성 (대시보드/목록/상세/그래프/워크플로우)
2. Figma Variables에 본 계약서 토큰을 등록하고 레지스트리와 동기화
3. 플러그인 린트/드라이런 메시지를 본 문서의 규칙표와 매핑
4. Dev Workspace 승인 UI에 Dry-run 요약 포맷 반영

# 14. 준비 현황 점검 (2025-09-29 기준)

- [x] Archetype DSL 샘플 작성 (`admin/specs/ui-archetypes/*.json`)
- [x] Figma Variables/Styles 동기화 (계약 토큰 반영)
- [ ] 플러그인 Dry-run 린트 규칙 반영 (경고/오류 코드 매핑)
- [ ] Dev Workspace 승인 UI 업데이트 (Dry-run 포맷 적용)
- [ ] 섹션 기반 통합 테스트 및 체크포인트 기록
