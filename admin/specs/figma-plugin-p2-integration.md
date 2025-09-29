---
file: admin/specs/figma-plugin-p2-integration.md
title: Figma 플러그인 P2 — 통합 테스트 및 문서 갱신 계획
owner: duksan
created: 2025-09-29 09:35 UTC / 2025-09-29 18:35 KST
updated: 2025-09-29 18:41 UTC / 2025-09-30 03:41 KST
status: draft
tags: [spec, figma, plugin, testing]
schemaVersion: 1
description: 섹션 트리 UI, 가드레일, Variables/Styles 매핑 기능을 통합 검증하고 문서를 업데이트하는 절차
---

# 1. 테스트 시나리오

| 시나리오            | 준비                                      | 기대 결과                                           |
| ------------------- | ----------------------------------------- | --------------------------------------------------- |
| 단일 섹션 실행      | `dashboard/sections/00-heading.json` 선택 | Dry-run/Apply 정상, 기록 1건                        |
| 다중 섹션 실행      | `dashboard/sections/{00,10,20}` 선택      | 선택 순서대로 실행, Dry-run 요약에 섹션 리스트 표시 |
| 가드레일 경고       | `nodeCount` 임계치 초과 섹션 사용         | Dry-run 요약에 warning, Apply 가능                  |
| 가드레일 실패       | 의도적으로 깊은 중첩 섹션                 | 해당 섹션 차단, Dry-run errors 배열에 기록          |
| 토큰 누락           | 존재하지 않는 토큰 사용                   | Dry-run 실패(`unknownToken`), 사용자 안내           |
| Variables 모드 부족 | dark 모드 미등록                          | `tokenWarnings` 표시 후 적용 가능                   |
| 체크포인트 연동     | Dry-run → 승인 → Apply                    | `admin/checkpoints/`에 자동 초안 생성               |

# 2. 자동화 계획

- CLI 스크립트 `scripts/test_figma_plugin.sh` (추후 구현)에서 JSON 섹션 조합을 시뮬레이션
- Dry-run/Apply API를 모킹하거나 플러그인 실행 로그(JSONL)를 검증

# 3. 문서 업데이트 체크리스트

- `admin/plan/figmapluginmake.md`: 수행된 P2 항목 체크/갱신
- `admin/specs/ui-archetypes/README.md`: 섹션 사용 방법/테스트 결과 반영
- `admin/plan/design-contract.md`: 준비 현황 섹션(14장) 업데이트
- 체크포인트: `admin/checkpoints/`에 결과 기록

# 4. 체크포인트 템플릿

```
## Summary
- 선택 섹션: dashboard/sections/00-heading.json, 10-kpi-row.json
- Dry-run 결과: created 2, warnings 1
- Apply 후: created 2, warnings 0

## Follow-ups
- [ ] Variables dark mode 보강
- [ ] pagination 섹션 분할 검토
```

# 5. 참고 문서

- `admin/specs/figma-plugin-p2-tree-ui.md`
- `admin/specs/figma-plugin-p2-telemetry.md`
- `admin/specs/figma-plugin-p2-variables.md`
