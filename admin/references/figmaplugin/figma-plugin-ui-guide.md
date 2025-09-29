---
file: admin/references/figmaplugin/figma-plugin-ui-guide.md
title: Plugin UI 러너 가이드 요약
owner: duksan
created: 2025-09-29 07:36 UTC / 2025-09-29 16:36 KST
updated: 2025-09-29 07:44 UTC / 2025-09-29 16:44 KST
status: draft
tags: [reference, figma, plugin, ui]
schemaVersion: 1
description: 플러그인 UI(Webview) 가이드를 참고하며 승인 UX 설계에 필요한 포인트 정리
---

## 원본 링크

- <https://www.figma.com/plugin-docs/how-plugins-run/>

## 집중 포인트

- Webview와 main 스레드 간 메시지 교환 규칙(`postMessage`, `onmessage`)
- UI 사이즈/모달/notification 구성 제한, `showUI` 옵션
- UI에서 외부 리소스 로드 시 CSP 제약
- 환경 변수 전달(`figma.command`, `parameters`) 방식

## 활용 메모

- Dev Workspace 승인 UI는 Webview 내부에서 토글/버튼으로 제공하고, main 스레드로는 최소한의 패치 명령만 보낸다.
- 관찰성 로그를 UI에 표시할 때는 main → UI 메시지 채널을 구분하고, 긴 로그는 다운로드 링크로 제공하는 방식을 고려한다.
- UI에서 Codex API를 호출하려면 manifest의 `networkAccess` 및 CORS 정책을 반드시 확인한다.

## 추가 TODO 연계

- [P2] 승인 플로 설계 시 UI 모달/패널 레이아웃을 정의하고, 메시지 채널 명세서를 작성한다.
- [P3] 성능 테스트 단계에서 UI 렌더링 비용을 측정해 긴 로그 표시 시 페이징 전략을 마련한다.
