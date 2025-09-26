---
file: admin/specs/wiki-learning-personas.md
title: Glossary 학습 UX 페르소나 및 레벨 테스트 시나리오
owner: duksan
created: 2025-09-26 08:04 UTC / 2025-09-27 02:04 KST
updated: 2025-09-26 08:28 UTC / 2025-09-26 17:28 KST
status: draft
tags: [wiki, glossary, persona, learning]
schemaVersion: 1
description: 학습 위키 맞춤형 경험 설계를 위한 사용자 페르소나와 레벨 테스트 흐름 정의
---

# 핵심 목표

- Glossary 학습 UX가 다양한 배경의 사용자를 빠르게 파악하고 맞춤형 콘텐츠/예시를 제공하도록 한다.
- 레벨 테스트 결과를 `admin/state/learning-profiles.json`에 기록해 커리큘럼 제안, 하이라이트 추천, AI 응답 컨텍스트에 활용한다.

# 페르소나 정의

## P1. 완전 초보(First Explorer)

- **배경**: IT 비전문가, 용어 자체가 낯설고 읽기 속도가 느림.
- **목표**: “코드/용어를 쉽게 설명해 주는 가이드” 확보.
- **UX 요구**: 초보 설명 우선 노출, 형광펜 색은 기본 노랑. Hover 카드에 쉬운 비유 포함.
- **추천 기능**: 드래그 퀵메뉴의 “용어 만들기”에 템플릿 제안, 책갈피 자동 저장.

## P2. 타 도메인 전문가(Cross-Domain Pro)

- **배경**: 기계설계/기획 등 다른 도메인 전문가는 있으나 웹/AI 용어는 낯섦.
- **목표**: 익숙한 개념에 빗댄 예시로 빠르게 이해.
- **UX 요구**: Hover 카드·보조 패널에 “유사 도메인 비유” 슬롯 제공, 메모 기본 태그에 `analogy` 포함.
- **추천 기능**: Split View 기본 On, 용어 하이라이트 시 해당 도메인 예시 자동 추천.

## P3. 학생/주니어(New Challenger)

- **배경**: 중·고·대학생 혹은 주니어 개발자, 학습 속도 빠르지만 배경지식 최소.
- **목표**: 짧은 타임박스(15~30분)로 학습, 퀴즈와 진도 관리.
- **UX 요구**: 책갈피 + TOC 읽음 점 표시, 메모에 간단 Q&A 템플릿 제공.
- **추천 기능**: Reading Progress 기반 복습 알림, 퀵메뉴에 “추가 학습 목록” 기본 On.

## P4. 실무자(Production Maintainer)

- **배경**: 기존 시스템 운영자, 빠르게 기능/정책 확인 필요.
- **목표**: 정확한 참조와 변경 로그 확인.
- **UX 요구**: 보조 패널에 “관련 코드/문서” 우선, 형광펜 색 기본 하늘색(리뷰 표시), 파일 트리에서 즉시 코드 탐색.
- **추천 기능**: Hover 카드에서 바로 “코드 열기” 버튼, 드래그 퀵메뉴에 “이슈/PR 링크 추가” 확장(후속).

# 레벨 테스트 흐름

1. **소개 단계**: 에이전트가 학습 목표/시간/선호 방식 3가지 질문으로 Trust building.
2. **배경지식 파악** (질문 ID: `background_*`)
   - 예: “Git 브랜치를 설명할 때 어떤 말이 가장 익숙한가?”
   - 응답 옵션은 페르소나 힌트를 포함하고 `learning-level-test.json`에 정의.
3. **학습 스타일 파악** (질문 ID: `style_*`)
   - 예: “새 개념을 배울 때 가장 도움이 되는 것은?” (비유/도식/코드/문서링크)
4. **시간/목표 파악** (질문 ID: `time_goal_*`)
   - 예: “이번 세션에서 투자할 수 있는 시간은?”
5. **결과 매핑**
   - 점수/우선순위에 따라 `profiles`에 `level`, `preferredExamples`, `timeBudget`, `goal` 저장.
   - UI에서는 Split View, Hover 카드, 하이라이트 팔레트 기본값을 사용자 프로필에 맞춰 초기화.

# 레벨 테스트 데이터 구조

- 질문/응답은 `admin/data/learning-level-test.json`에 JSON 형태로 유지.
- 각 질문에는 `id`, `section`, `prompt`, `type`, `options`, `personaHints`, `weight` 등을 포함한다.
- 여러 번 테스트 하는 사용자를 위해 응답은 학습 로그(`admin/state/learning-log.json`)와 연계할 수 있도록 `sessionId`를 별도 관리한다.

# 후속 작업 가이드

- 질문/옵션은 분기별로 리뷰하고 업데이트 내역을 체크포인트에 기록한다.
- 프로필은 에이전트 추천/응답 컨텍스트에 영향을 주므로, LLM 호출 시 `profile` 정보를 prompt context에 포함시킨다.
- 역으로 학습 도중(하이라이트/메모 등) 캡쳐된 신호로 프로필을 보정한다 (예: 하이라이트 색 분포, 추가 학습 토글 빈도).

# code_refs

- code_refs: ["admin/data/learning-level-test.json", "admin/state/learning-profiles.json", "admin/specs/wiki-glossary-learning.md"]
