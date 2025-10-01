---
file: admin/plan/figmaplugin-roadmap.md
title: Figma Plugin 실행 로드맵 & 진행 기록
owner: duksan
created: 2025-09-27 06:10 UTC / 2025-09-27 15:10 KST
updated: 2025-10-01 12:31 UTC / 2025-10-01 21:31 KST
status: in_progress
tags: [plan, figma, roadmap]
schemaVersion: 1
description: 설계 문서에 정의된 기능을 실행 순서와 의존 관계에 따라 관리하고, 각 단계의 시작·종료 기록을 누적하는 로드맵
doc_refs: ['admin/plan/figmapluginmake.md', 'admin/plan/figmaplugin-terminology.md']
code_refs: []
---

# 1. 사용 방법

- 설계 기준: `admin/plan/figmapluginmake.md`
- 용어 기준: `admin/plan/figmaplugin-terminology.md`
- 실행 단계/상태는 본 문서 표만 갱신한다. 완료 시 체크포인트·ResultLog에 동일 ID를 남긴다.
- 시작/종료 시각은 `YYYY-MM-DD HH:MM UTC / KST` 형식으로 기록한다.

# 2. 단계 요약

| 단계 | 목표                                     | 완료 조건                                                 | 참고                                       |
| ---- | ---------------------------------------- | --------------------------------------------------------- | ------------------------------------------ |
| P0   | 기존 구조 파악 및 샘플 확보              | 의존 맵, 샘플 JSON 3종 확보                               | 체크포인트 `20250930-1833-UTC_0333-KST.md` |
| P1   | Manifest/Runtime 모듈화 + 증분 갱신 정비 | Runtime 모듈 분리, 증분 갱신 검증, Guardrail 강화         | 실행 ID: TODO-P1-01 ~ P1-03                |
| P2   | UI/스토어 리팩터링 + 관찰성 강화         | RouteTree/Execution/ResultLog/QuickActions 수용 기준 충족 | 실행 ID: TODO-P2-01 ~ P2-04                |
| P3   | 문서/테스트/자동화 정비                  | 공통 규칙 검증, CI 파이프라인 업데이트                    | 실행 ID: TODO-P3-01                        |

# 3. 실행 TODO & 진행 기록

| ID         | 범주                 | 상세 설명                                                                  | 선행       | 상태 | 시작 (UTC / KST)                    | 종료 (UTC / KST)                    | 비고                                                                                                     |
| ---------- | -------------------- | -------------------------------------------------------------------------- | ---------- | ---- | ----------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| TODO-P1-01 | Manifest             | Validator/Normalizer/Emitter 분리, AJV 스키마 업데이트                     | P0         | 완료 | 2025-09-30 18:10 / 2025-10-01 03:10 | 2025-10-01 06:24 / 2025-10-01 15:24 | 완료 – loader/normalizer/validator 분리, AJV 스키마 적용                                                 |
| TODO-P1-02 | Runtime              | SurfaceConfig/SlotManager/Executor/Guardrails 모듈화 및 단위 테스트        | TODO-P1-01 | 완료 | 2025-10-01 04:30 / 2025-10-01 13:30 | 2025-10-01 06:41 / 2025-10-01 15:41 | 완료 – surface/guardrail/executor 메타 테스트 추가                                                       |
| TODO-P1-03 | 증분 갱신            | `pluginData` 표준키 적용, diff-engine 개선, ResultLog/Checkpoint diff 포함 | TODO-P1-02 | 대기 | —                                   | —                                   | 대기 – diff-engine 개선 착수 전                                                                          |
| TODO-P2-01 | RouteTree UX         | 계층별 펼침/체크, Manifest 라벨/카운트 연동, 선택 스냅샷                   | TODO-P1-02 | 진행 | 2025-10-01 04:45 / 2025-10-01 13:45 | —                                   | 진행 중 – Surface 탭(페이지 동기화)·Route/Slot 일괄 선택 정비, 선택 스냅샷 저장·복원 및 테스트 작성 완료 |
| TODO-P2-02 | ExecutionControls    | Dry-run/Apply 활성화 조건, TargetSelect 동기화, 실패 메시지                | TODO-P1-02 | 진행 | 2025-10-01 04:50 / 2025-10-01 13:50 | —                                   | 진행 중 – 활성화 조건 검증                                                                               |
| TODO-P2-03 | QuickActions/Preview | 선행 조건 검증, 관찰성 메타 기록, 실패 핸들링                              | TODO-P1-02 | 대기 | —                                   | —                                   | 대기 – QuickActions 선행 조건 정의 필요                                                                  |
| TODO-P2-04 | ResultLog/Guardrail  | Slot diff, payload 해시, Undo/Redo 20개 유지                               | TODO-P1-03 | 대기 | —                                   | —                                   | 대기 – diff-engine 개선 후 착수                                                                          |
| TODO-P3-01 | 문서/테스트          | 공통 규칙 링크 점검, CI에 UI/Runtime smoke 테스트 추가                     | P2 완료    | 대기 | —                                   | —                                   | 대기 – P2 종료 후 실행                                                                                   |

## 실행 루프 복원 (Dry Run → Preview → Apply)

| ID      | 범주            | 상세 설명                                                                                | 선행       | 상태 | 시작 (UTC / KST) | 종료 (UTC / KST) | 비고                                                         |
| ------- | --------------- | ---------------------------------------------------------------------------------------- | ---------- | ---- | ---------------- | ---------------- | ------------------------------------------------------------ |
| LOOP-01 | Preview Frame   | Dry Run 시 프리뷰 전용 프레임 생성/재사용, 분홍(렌더)·노랑(리포트) 영역 렌더링           | TODO-P2-01 | 대기 | —                | —                | 프리뷰 프레임 생성/초기화 로직, Guardrail/Result 메타 동기화 |
| LOOP-02 | Preview UI 연동 | previewStore/PreviewControls 업데이트, 프레임 포커스·섹션 하이라이트·ResultLog 링크 제공 | LOOP-01    | 대기 | —                | —                | Dry Run 결과를 UI/로그와 연결, 프리뷰 이동 액션 제공         |
| LOOP-03 | Apply 흐름      | Dry Run 데이터 기반 실제 Surface 적용, 체크포인트/로그/프리뷰 초기화                     | LOOP-02    | 대기 | —                | —                | Apply 전에 Dry Run 성공 여부 검증, diff 기반 프레임 갱신     |

> 상태 값: 진행 / 대기 / 완료 / 보류. 완료 시 종료 시간과 산출물 링크를 비고에 추가한다.

## 현재 실행 순서 (회의 모드)

1. Surface 탭 라벨 정리 — Figma 페이지 이름(`admin / user / common`)을 강제로 `Admin / User / Common`으로 매핑하고 순서를 고정한다.
2. 레이아웃 여백 최소화 — 전체 컨테이너 및 카드 padding/gap을 제거해 900×600 화면을 트리·실행 영역이 최대한 활용하도록 조정한다.
3. 실행 중심 배치 — 좌측 트리 / 우측 Execution·Schema·Guardrail·Preview·ResultLog 순으로 재배치하고 QuickActions 등 편의 기능은 우측 하단 카드에 집약한다.

# 4. 백로그

| ID    | 설명                            | 고려 시점  | 메모                                 |
| ----- | ------------------------------- | ---------- | ------------------------------------ |
| BL-01 | 프리뷰 프레임 자동 생성 UX 실험 | P2 종료 후 | Dry-run 프레임 재활용 전략 재검토    |
| BL-02 | Dry-run QA 체크리스트 자동화    | P3 진행 중 | 체크리스트 결과를 Guardrail에 통합   |
| BL-03 | 플러그인 배포 전략 문서화       | P3 이후    | Private → Team → Community 단계 정리 |

# 5. 업데이트 규칙

1. 새 작업은 ID를 부여한 뒤 3장 표에 추가한다.
2. 상태 변경 시 체크포인트·ResultLog에 동일 ID를 기록하고, 시작/종료 시각(완료 시 반드시 종료 시각)과 비고를 갱신한다.
3. 반복 항목은 백로그로 옮겨 우선순위를 재검토한다.
4. 문서 구조나 단계 정의 변경 시 설계 문서(§6)와 용어집을 동시에 업데이트한다.
