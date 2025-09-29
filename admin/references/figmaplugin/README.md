---
file: admin/references/figmaplugin/README.md
title: Figma 플러그인 고도화 참고 자료 인덱스
owner: duksan
created: 2025-09-29 07:36 UTC / 2025-09-29 16:36 KST
updated: 2025-09-29 18:41 UTC / 2025-09-30 03:41 KST
status: draft
tags: [reference, index]
schemaVersion: 1
description: Figma 플러그인 고도화를 위해 수집한 로컬 참고 노트의 목록과 활용 가이드
---

## 구성 파일

- `figma-plugin-api.md` — Plugin API Reference 요약
- `figma-plugin-samples.md` — 공식 샘플 분석 포인트
- `figma-manifest-v2.md` — Manifest 설정 체크 리스트
- `figma-plugin-ui-guide.md` — Plugin UI(Webview) 가이드 요약
- `figma-developer-api.md` — REST API 확장 고려 사항
- `automation-plugins-research.md` — Automator/Locofy 등 벤치마크
- `design-token-tools.md` — 디자인 토큰/Variables 참고
- `admin/specs/figmaplugin-p1-design.md` — P1 설계 요약 (컴포넌트·DSL·패치·검증)
- `admin/plan/design-contract.md` — 관리자 UI 설계 계약(토큰·타이포·레이아웃·DoD)

## 활용 제안

1. P1 작업(컴포넌트 레지스트리·레이아웃 DSL·증분 패치) 착수 전에 관련 노트를 정독해 설계 시 빠질 수 있는 항목을 체크한다.
2. 조사 중 새로 알게 된 사실은 각 노트 하단에 Bullet로 추가하고, 업데이트 시각을 갱신한다.
3. 외부 자료 스크린샷이나 예제 JSON은 `admin/references/figmaplugin/snapshots/` 디렉터리에 보관하고, 노트에서 링크로 연결한다.

## 향후 확장

- Dev Workspace와 직접 연계되는 문서(예: 승인 UX 설계안)는 `admin/plan/devworkspace.md`와 교차 참조한다.
- 참고 자료가 늘어나면 하위 폴더를 만들어 카테고리별로 정리한다(예: `tokens/`, `dsl/`, `interfaces/`).
