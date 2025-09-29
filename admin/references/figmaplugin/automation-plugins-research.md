---
file: admin/references/figmaplugin/automation-plugins-research.md
title: 자동화 플러그인 벤치마크 노트
owner: duksan
created: 2025-09-29 07:36 UTC / 2025-09-29 16:36 KST
updated: 2025-09-29 07:44 UTC / 2025-09-29 16:44 KST
status: draft
tags: [reference, research, automation]
schemaVersion: 1
description: Automator, Locofy 등 자동화 플러그인의 동작을 분석해 고도화 아이디어를 도출하기 위한 가이드
---

## 조사 대상

- Automator (Figma Community): No-code 액션 조합, 조건부 실행, 동적 파라미터
- Locofy (Plugin & External Service): 컴포넌트 네이밍, 코드 Export 흐름
- Figma Tokens/Variables 관련 커뮤니티 플러그인

## 살펴볼 항목 체크리스트

1. 명령 구성 방식: 사용자가 액션을 쌓아 실행하는지, JSON/스크립트 기반인지
2. 이름 규칙: 디자인 컴포넌트와 코드 아웃풋의 이름을 어떻게 동기화하는지
3. 레이아웃 추상화: Auto Layout, Constraints, Grid를 어떤 DSL로 표현하는지
4. 증분 업데이트: 기존 요소를 덮어쓰는지, 새 프레임을 만드는지, 차이 보고를 제공하는지
5. 로그/피드백: 실행 후 사용자가 어떤 형태의 보고를 받는지 (모달, 패널, 다운로드 링크 등)
6. 배포/권한: Private vs Public, Update 정책, 팀 공유 절차

## 조사 방법 제안

- 플러그인을 직접 설치해 작은 예제를 실행하고, 실행 로그와 생성물 구조를 캡처한다.
- JSON/설정 파일을 추출할 수 있다면 `admin/references/figmaplugin/snapshots/`에 저장하고 메타데이터를 남긴다.
- 부족한 정보는 커뮤니티 포럼이나 블로그 글을 참고하되, 핵심 구조만 요약해 기록한다.

## 추가 TODO 연계

- [P1] 컴포넌트 레지스트리 설계 전에 Automator/Locofy의 네이밍 규칙을 비교해 베스트 프랙티스를 도출한다.
- [P1] 레이아웃 DSL 작성 시 Automator 액션 구조를 참고해 사용자 친화성을 확보한다.
- [P2] 관찰성 설계 시 다른 플러그인의 로그/Undo UX를 시연하며 참고 스크린샷을 수집한다.
