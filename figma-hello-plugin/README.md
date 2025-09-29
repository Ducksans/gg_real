---
file: figma-hello-plugin/README.md
title: GG Figma Automation Plugin
owner: duksan
created: 2025-09-29 03:05 UTC / 2025-09-29 12:05 KST
updated: 2025-09-29 03:57 UTC / 2025-09-29 12:57 KST
status: draft
tags: [figma, plugin, automation]
schemaVersion: 1
description: Codex와 연동해 JSON 명세 기반으로 프레임을 생성하는 실험용 Figma 플러그인 보일러플레이트
---

# GG Figma Automation Plugin

Codex와 함께 UI 명세(JSON)를 받아 Figma에서 자동으로 프레임을 그리기 위한 실험용 플러그인입니다.

## 구성

- `src/` : TypeScript 원본 코드
  - `main.ts` : 플러그인 엔트리
  - `controller.ts` : 실행 흐름 및 데모 액션
  - `lib/` : 노드 생성/토큰 매핑 유틸리티
  - `schema.ts` : JSON 스키마 타입 정의
  - `ui/index.html` : 플러그인 패널 UI
- `dist/` : Figma에서 참조하는 번들 결과 (빌드 산출물)
- `scripts/` : 빌드 보조 스크립트
- `manifest.json` : 플러그인 메타/엔트리 지정

## 개발 명령

```bash
npm install        # esbuild, typescript 설치
npm run build      # dist/main.js, dist/ui.html 생성
npm run watch      # main.ts 변경 감지 후 번들
npm run typecheck  # 타입 검사
```

빌드 후 `manifest.json`을 Figma Desktop의 "플러그인 → 개발 → manifest 가져오기"에서 선택하면 됩니다.

## 다음 단계

- `src/lib/nodeFactory.ts`에 JSON 스키마 기반 생성 로직 구현
- 토큰 매핑 및 디자인 토큰 테이블 연동
- UI에서 JSON 붙여넣기 → 스키마 파싱 → 노드 생성 흐름 연결
