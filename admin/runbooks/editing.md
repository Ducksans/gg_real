---
file: admin/runbooks/editing.md
title: 문서 편집 및 PR 생성 런북
owner: duksan
created: 2025-09-24 07:56 UTC / 2025-09-24 16:56 KST
updated: 2025-09-24 08:17 UTC / 2025-09-24 17:17 KST
status: draft
tags: [runbook, editing, workflow]
schemaVersion: 1
description: Markdown 문서를 안전하게 편집하고 브랜치/PR을 생성하는 표준 작업 절차
code_refs:
  [
    'scripts/edit_flow.js',
    'scripts/update_frontmatter_time.js',
    'scripts/checkpoint.sh',
    'basesettings.md',
  ]
---

## 목적

- 문서 수정 시 브랜치 생성, 메타(updated) 자동 갱신, 검증 실행, PR 생성까지 표준화한다.

## 준비 사항

- 작업 트리가 깨끗한 상태인지 `git status`로 확인한다.
- `pnpm install`이 완료되어 있어야 하며 GitHub CLI에 로그인되어 있는지 점검한다.

## 절차

### 1. 편집 브랜치 생성

```bash
pnpm edit:start admin/data/README.md
```

- 기본 브랜치 네이밍은 `edit/<slug>-YYYYMMDD-HHMM` 형태로 생성된다.
- dry-run 검증이 필요하면 `--dry-run` 플래그를 사용한다.

### 2. 문서 편집

- 에디터에서 필요한 수정을 진행한다.
- 변경 내역이 여러 파일에 걸칠 경우 각 파일별로 변경 사유를 기록한다.

### 3. 메타 갱신 및 검증

```bash
pnpm edit:prepare admin/data/README.md
```

- `updated` 메타가 현재 시각(UTC/KST)으로 갱신된다.
- `pnpm run validate:docs`, `pnpm run validate:refs`가 순차 실행되어 프런트매터/참조를 검증한다.
- 추가 검증이 필요하면 `pnpm --filter web lint` 등 팀 표준을 실행한다.

### 4. 커밋 및 체크포인트

```bash
git status
git add admin/data/README.md
git commit -m "docs: update admin data readme"
scripts/checkpoint.sh
```

- 체크포인트 파일은 `admin/checkpoints/`에 생성되며, 주요 변경 내용을 요약한다.

### 5. PR 생성

- (후속) [`scripts/pr_create.sh`] 스크립트가 준비되면 이를 활용한다.
- 현재는 `gh pr create --fill`을 사용하며, 설명에 체크포인트 및 관련 문서를 링크한다.

## 참고

- 여러 문서를 동시에 수정할 경우 `pnpm edit:prepare` 명령을 각 파일 경로에 대해 반복 실행한다.
- 런북, 기반 문서 등 중요한 파일은 PR 설명에 영향 범위를 명시한다.
- 스크립트 동작은 `scripts/edit_flow.js --dry-run`으로 사전 검증할 수 있다.
