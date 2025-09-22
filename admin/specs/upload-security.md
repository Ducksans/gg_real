---
file: admin/specs/upload-security.md
title: 업로드 보안(안티바이러스 큐/EXIF 제거) 설계 초안
owner: duksan
created: 2025-09-22 11:17 UTC / 2025-09-22 20:17 KST
updated: 2025-09-22 11:17 UTC / 2025-09-22 20:17 KST
status: active
tags: [security, upload]
schemaVersion: 1
description: 파일 업로드에 대한 보안 큐(바이러스 검사)와 이미지 EXIF 제거 파이프라인 설계
---

# 파이프라인 개요
- 단계: 수신 → 격리(임시 스토리지) → 안티바이러스 스캔 → EXIF 제거(이미지) → 안전 스토리지 확정 → 메타 기록
- 실패 시: 격리 보관 + 관리자 알림 + 사용자에게 안전 메시지 반환

# 기술 선택(예시)
- AV: ClamAV(로컬/컨테이너), 스캔 결과 코드/로그 표준화
- EXIF 제거: exiftool 또는 라이브러리 수준 처리, 결과 검증 해시 비교
- 스토리지: S3 호환 버킷(서명 URL 최소 권한)

# 수용기준
- 악성으로 판정 시 저장 보류 및 관리자 경보
- 이미지 업로드는 EXIF 메타가 제거되어 저장됨
- 처리 단계와 결과가 감사 로그에 남음

# code_refs
- code_refs: ["SECURITY.md", "THREAT_MODEL.md"]
