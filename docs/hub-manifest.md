---
file: docs/hub-manifest.md
title: Hub 매니페스트 작성 가이드(Manifest-Driven Graph)
owner: duksan
created: 2025-09-22 09:48 UTC / 2025-09-22 18:48 KST
updated: 2025-09-22 09:48 UTC / 2025-09-22 18:48 KST
status: active
tags: [docs, manifest, graph]
schemaVersion: 1
description: 서비스/잡/문서/UI/데이터 컴포넌트를 선언적으로 기술하여 그래프·헬스·부팅을 단일 근거에서 구동
---

# 핵심 원칙
- hub.yaml은 각 컴포넌트의 단일 진실원입니다(type/stage/의존성/헬스/실행/결정/부족항목).
- 가능한 한 작게 시작합니다: 문서(doc) 컴포넌트부터 작성해도 됩니다.
- 파일 위치는 초기에는 `admin/manifests/*.yaml`에 모으고, 후에 실제 컴포넌트 루트로 이동합니다.

# 필드 요약(필수/중요)
- id, name, type(service|job|doc|ui|data), stage(design|proto|dev|test|prod)
- owner, repo_path, docs[], depends_on[], provides[]
- healthcheck: { type(http|command|none), url, expected_status, interval_seconds }
- run: { up, down, logs }
- acceptance[], gaps[], decisions[{id,title,doc}]

# 샘플(문서 컴포넌트)
```yaml
id: contenthub.docs
name: "Project Docs"
type: doc
stage: design
owner: "덕산"
repo_path: "admin"
docs:
  - "AGENTS.md"
  - "basesettings.md"
  - "admin/plan/improvement-rounds.md"
depends_on: []
provides: []
healthcheck:
  type: none
run: {}
acceptance:
  - "모든 문서 프런트매터/UTC·KST 포맷 검증 통과"
gaps:
  - "일부 문서의 code_refs 보강 필요"
decisions: []
```

# 검증/CI
- 스키마: `admin/schemas/hub.schema.json`으로 검증합니다.
- CI: docs-validate 워크플로우가 `admin/manifests/*.yaml`을 스키마로 검사합니다.

# code_refs
- code_refs: ["admin/schemas/hub.schema.json", ".github/workflows/docs-validate.yml", "scripts/validate_docs.sh"]
