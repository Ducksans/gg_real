---
file: admin/decisions/index.md
title: 결정 로그(중대한 의사결정 중앙 저장소)
owner: duksan
created: 2025-09-22 08:25 UTC / 2025-09-22 17:25 KST
updated: 2025-09-22 08:25 UTC / 2025-09-22 17:25 KST
status: active
tags: [decisions, governance]
schemaVersion: 1
description: 중대한 결정들을 카드 형태로 기록하고 PR/체크포인트/SoT와 상호 링크
---

## 사용 방법
- 각 중대한 결정을 `YYYY-MM-DD-<slug>.md` 파일로 추가하고, 본 문서에서 목록으로 링크합니다.
- 체크포인트와 PR 설명문에도 해당 결정 파일 경로를 포함합니다.

## 템플릿(복사해서 새 파일로 사용)
<TEMPLATE>
---
file: admin/decisions/YYYY-MM-DD-<slug>.md
title: <결정 제목>
owner: <작성자>
created: YYYY-MM-DD HH:MM UTC / YYYY-MM-DD HH:MM KST
updated: YYYY-MM-DD HH:MM UTC / YYYY-MM-DD HH:MM KST
status: decided
tags: [decision]
schemaVersion: 1
description: <배경/선택지/결정/영향 요약>
links:
  pr: <PR 링크>
  checkpoint: <체크포인트 파일 경로>
  docs: ["basesettings.md", "admin/plan/improvement-rounds.md"]
---

## 배경

## 대안 비교

## 최종 결정

## 실행/영향
</TEMPLATE>

## 목록
- (예시) 2025-09-22 — 베이스 아키텍처 확정 — admin/decisions/2025-09-22-arch-baseline.md

