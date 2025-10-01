---
file: admin/docs/execution-contract.md
title: ExecutionPayload 메시지 계약
owner: duksan
created: 2025-10-01 14:05 UTC / 2025-10-01 23:05 KST
updated: 2025-10-01 16:11 UTC / 2025-10-02 01:11 KST
status: draft
tags: [ui, runtime, contract]
schemaVersion: 1
description: UI와 런타임 사이에서 Dry Run / Apply 실행 시 사용하는 ExecutionPayload DTO 정의와 검증 규칙
code_refs:
  [
    'figma-hello-plugin/src/shared/execution-contract.ts',
    'figma-hello-plugin/src/runtime/executor/index.ts',
    'figma-hello-plugin/tests/execution-contract.test.ts',
    'figma-hello-plugin/src/ui/hooks/useExecutionModel.ts',
  ]
---

## Payload 정의

```ts
interface ExecutionPayload {
  intent: 'dry-run' | 'apply';
  documents: string[]; // SchemaDocument JSON 문자열 배열
  targetPage?: string;
  targetMode?: 'append' | 'replace' | 'update';
  targetFrameName?: string;
}
```

## 전송 규칙

1. UI는 `documents`를 반드시 `JSON.stringify`로 직렬화한 문자열 배열로 전송한다.
2. 빈 선택 또는 직렬화 실패(공백 문자열 포함) 시 UI 단계에서 오류를 표시하고 런타임으로 메시지를 보내지 않는다.
3. 런타임은 `isExecutionPayload`로 검증하며, 계약을 충족하지 않으면 Dry Run을 거부하고 오류를 반환한다.
4. Dry Run 결과는 Guardrail Summary/Result Log에 기록되고, 프리뷰 프레임(선택한 페이지)으로 렌더링되어야 한다.

```

```
