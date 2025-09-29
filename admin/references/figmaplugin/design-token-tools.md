---
file: admin/references/figmaplugin/design-token-tools.md
title: 디자인 토큰 관리 참고 노트
owner: duksan
created: 2025-09-29 07:36 UTC / 2025-09-29 16:36 KST
updated: 2025-09-29 07:44 UTC / 2025-09-29 16:44 KST
status: draft
tags: [reference, tokens, figma]
schemaVersion: 1
description: Figma Variables/Styles와 외부 토큰 도구를 비교해 토큰 거버넌스 설계에 참고하기 위한 자료
---

## 원본 링크

- Figma Variables 소개: <https://help.figma.com/hc/en-us/articles/14476346364631>
- Tokens Studio for Figma: <https://www.figma.com/community/plugin/843461159747178978>
- Figma Styles 문서: <https://help.figma.com/hc/en-us/articles/360040451373>

## 확인 포인트

- Variables 레이어 구조: Collections, Modes, Scopes
- Styles와 Variables 병행 사용 시 네이밍 규칙 및 동기화 전략
- Tokens Studio 내보내기 포맷(JSON)과 코드 토큰 파이프라인 연계 방법

## 활용 메모

- 토큰 레지스트리가 Variables를 우선 참조하도록 설계하려면, Collection/Mode를 JSON 스키마에서 지정할 수 있게 해야 한다.
- Tokens Studio를 사용하면 REST API 없이도 JSON 토큰 내보내기가 가능하므로 초기 PoC에 활용 가치가 있다.
- 다크/라이트 모드 전환은 Variables Mode 전환 기능을 사용하고, Styles는 레거시 호환용으로 유지한다.

## 추가 TODO 연계

- [P2] Variables/Styles 우선 순위 구현 전에 Variables 구조를 테스트 Workspace에서 구성하고 JSON 명세에 반영한다.
- [P3] 배포 단계에서 토큰 업데이트 절차(Variables → Git 토큰 JSON → 플러그인 sync)를 정의한다.
