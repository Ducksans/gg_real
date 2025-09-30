import type { SchemaDocument } from '../../schema';
import type { SurfaceConfig } from '../surface-config';

import { measureNodeGraph } from './counters';
import { guardrailThresholds } from './thresholds';
import { validateSlotPlacement } from './validators';

export interface GuardrailResult {
  readonly warnings: string[];
  readonly errors: string[];
  readonly metrics: {
    readonly nodeCount: number;
    readonly depth: number;
    readonly fileSize: number;
  };
}

export const evaluateGuardrails = (
  doc: SchemaDocument,
  rawLength: number,
  surface: SurfaceConfig,
): GuardrailResult => {
  const warnings: string[] = [];
  const errors: string[] = [];

  const { count, maxDepth } = measureNodeGraph(doc.nodes ?? []);
  const fileSize = rawLength;

  if (count >= guardrailThresholds.fail.nodeCount) {
    errors.push(`노드 수(${count})가 허용치를 초과했습니다. 섹션을 분할하세요.`);
  } else if (count >= guardrailThresholds.warn.nodeCount) {
    warnings.push(`노드 수가 많습니다(${count}). 섹션 분할을 고려하세요.`);
  }

  if (maxDepth >= guardrailThresholds.fail.depth) {
    errors.push(`중첩 수준(${maxDepth})이 너무 깊습니다. 레이아웃을 단순화하세요.`);
  } else if (maxDepth >= guardrailThresholds.warn.depth) {
    warnings.push(`중첩 수준이 높습니다(${maxDepth}). 구조를 점검하세요.`);
  }

  if (fileSize >= guardrailThresholds.fail.fileSize) {
    errors.push(`JSON 크기(${Math.round(fileSize / 1024)}KB)가 허용치를 초과했습니다.`);
  } else if (fileSize >= guardrailThresholds.warn.fileSize) {
    warnings.push(`JSON 크기가 큽니다(${Math.round(fileSize / 1024)}KB).`);
  }

  warnings.push(...validateSlotPlacement(doc, surface));

  return {
    warnings,
    errors,
    metrics: {
      nodeCount: count,
      depth: maxDepth,
      fileSize,
    },
  };
};
