---
file: admin/references/figmaplugin/figma-manifest-v2.md
title: Plugin Manifest v2 체크 포인트
owner: duksan
created: 2025-09-29 07:36 UTC / 2025-09-29 16:36 KST
updated: 2025-09-29 07:44 UTC / 2025-09-29 16:44 KST
status: draft
tags: [reference, figma, manifest]
schemaVersion: 1
description: manifest v2 문서를 참고하며 권한/런타임 설정을 정리한 노트
---

## 원본 링크

- <https://www.figma.com/plugin-docs/manifest/>

## 확인할 핵심 항목

- `api_version`, `plugin_type`, `main`, `ui`, `networkAccess`, `editorType` 필드 의미
- 권한 관련 옵션: `capabilities`, `enableProposedApi`, `disableUI` 등
- 환경 변수 및 설정 파일 경로 지정 방법(`parameterOnly`, `editorType` 복수 지정 등)
- 명령(Command) 정의: `menu` 배열과 Run when parameters

## 활용 메모

- Codex ↔ 플러그인 통신을 위한 네트워크 사용이 필요한 경우 `networkAccess` 설정을 미리 검토한다.
- Dev Workspace에서 안전하게 실행하려면 `parameterOnly` 모드를 활용해 특정 명령만 노출하는 방법을 고려한다.
- manifest 버전 업에 대비해 schemaVersion 필드와의 연계(플러그인 내부 스키마 버전) 전략을 문서화한다.

## 추가 TODO 연계

- [P2] 인터페이스 설계 시 manifest 권한 요구사항을 문서화해 승인 흐름에서 사용자에게 명확히 안내한다.
- [P3] 배포 전략 수립 시 manifest 변경 이력과 버전 정책을 체크포인트에 기록한다.
