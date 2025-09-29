---
file: admin/specs/figma-plugin-p2-telemetry.md
title: Figma 플러그인 P2 — 관찰성 및 승인 UX 연동
owner: duksan
created: 2025-09-29 09:27 UTC / 2025-09-29 18:27 KST
updated: 2025-09-29 18:41 UTC / 2025-09-30 03:41 KST
status: draft
tags: [spec, figma, plugin, telemetry]
schemaVersion: 1
description: 섹션 기반 Dry-run 결과를 Dev Workspace/체크포인트와 연결하고 승인 흐름을 자동화하기 위한 설계안
---

# 1. 목표

- Dry-run/Apply 결과를 섹션 단위로 기록하고, Dev Workspace 승인 패널과 체크포인트 작성에 자동 반영한다.
- 경고/오류를 시각적으로 강조해 빠른 피드백 루프를 형성한다.

# 2. 데이터 모델

```json
{
  "page": "dashboard",
  "sections": [
    { "id": "dashboard/sections/00-heading.json", "result": "created", "warnings": [] },
    {
      "id": "dashboard/sections/10-kpi-row.json",
      "result": "updated",
      "warnings": ["nodeCountWarning"]
    }
  ],
  "metrics": { "created": 2, "updated": 1, "removed": 0, "warnings": 1 },
  "warnings": [
    {
      "code": "nodeCountWarning",
      "section": "dashboard/sections/10-kpi-row.json",
      "message": "섹션이 복잡합니다. 분할을 권장합니다."
    }
  ],
  "errors": [],
  "specHash": "c4a1e3b2",
  "executedAt": "2025-09-29T09:27:00Z"
}
```

# 3. Dev Workspace / 플러그인 UI 연동

- 플러그인 UI에 "Dry-run 결과 로그" 패널을 제공해 성공/경고/오류 메시지와 결과 요약(섹션·메트릭)을 즉시 확인
- 승인 패널에 Dry-run 결과를 카드 형태로 표시: 페이지, 선택 섹션, 결과 요약, 경고 목록
- "체크포인트 초안 생성" 버튼을 제공하여 위 데이터를 기반으로 `admin/checkpoints/` 초안 파일을 자동 생성
- Apply 완료 후, 동일 데이터를 업데이트하여 최종 결과를 기록

# 4. Figma UI 피드백

- `figma.notify`는 "대시보드 섹션 3개 적용 (경고 1)" 같은 요약 문구만 사용
- 상세 내용은 플러그인 UI와 Dev Workspace 승인 패널에서 확인

# 5. 메시지 포맷

- 성공/경고/오류: `{ type: 'dry-run-success' | 'dry-run-warning' | 'dry-run-error', message: string }`
- 결과 요약: `{ type: 'dry-run-result', payload: { page, frameName, sections[], metrics, warnings[], errors[] } }`
- 향후 Dev Workspace 패널은 동일 포맷을 수신해 카드 형태로 렌더링 예정

# 6. 로그 저장

- Figma 노드 `pluginData.codex.history`에 `{ sectionId, result, specHash, executedAt }` 배열을 append
- 로컬 로그(예: `logs/plugin-run.jsonl`)에도 동일 정보를 저장해 추후 분석 가능

# 7. 시각 요소

- 섹션 상태 아이콘: Completed ✓, Warning !, Failed ✕
- 경고/오류는 색상 토큰(`color.status.warning`, `color.status.danger`)을 적용

# 8. 참고 문서

- `admin/plan/figmapluginmake.md`
- `admin/specs/figma-plugin-p2-tree-ui.md`
- `admin/plan/design-contract.md`
