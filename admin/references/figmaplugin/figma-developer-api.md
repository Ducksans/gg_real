---
file: admin/references/figmaplugin/figma-developer-api.md
title: Figma REST API 검토 노트
owner: duksan
created: 2025-09-29 07:36 UTC / 2025-09-29 16:36 KST
updated: 2025-09-29 07:44 UTC / 2025-09-29 16:44 KST
status: draft
tags: [reference, figma, rest, api]
schemaVersion: 1
description: 플러그인 외부 연동을 대비해 Figma REST API 문서를 살펴볼 때 주의할 사항 정리
---

## 원본 링크

- <https://www.figma.com/developers/api>

## 확인 포인트

- 파일/버전 조회: 문서 ID, 노드 ID, 버전 히스토리 조회 방법
- 컴포넌트/스타일 엔드포인트: 디자인 시스템 동기화 가능 여부 평가
- Webhooks: 파일 업데이트 이벤트 처리 흐름
- 인증: Personal Access Token, OAuth 2.0 흐름, Rate Limit 규칙

## 활용 메모

- Codex ↔ 플러그인 통합을 Rest API로 확장할 경우, 전용 서비스 계정을 사용해 Rate Limit을 관리한다.
- Dev Workspace에서 문서 미리보기를 제공할 때는 REST API와 Embed API를 혼용할 전략을 수립한다.
- 토큰 자동 동기화 시 REST API 호출 순서(Variables → Styles → Components)를 미리 정해둔다.

## 추가 TODO 연계

- [P2] 인터페이스 문서화 단계에서 REST API 호출 권한과 데이터 보관 정책을 명확히 정리한다.
- [P3] 배포 전략에 REST API 토큰 관리(회전 주기, 저장 위치) 계획을 포함한다.
