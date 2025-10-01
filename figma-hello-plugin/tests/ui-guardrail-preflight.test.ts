import { describe, expect, it } from 'vitest';

import { evaluateGuardrailPreflight } from '../src/ui/services/guardrail-preflight';
import { guardrailThresholds } from '../src/shared/guardrails';
import type { SchemaDocument } from '../src/schema';

const createTextNode = (index: number) => ({
  type: 'text',
  name: `Node ${index}`,
  text: {
    content: `Item ${index}`,
    style: { token: 'typo.body.md' },
  },
});

const createDocumentWithNodes = (count: number): SchemaDocument => ({
  schemaVersion: '1.0.0',
  meta: {
    section: `section-${count}`,
    title: `Section ${count}`,
  },
  nodes: Array.from({ length: count }, (_, index) => createTextNode(index)),
});

describe('evaluateGuardrailPreflight', () => {
  it('reports warning when node count reaches warn threshold', () => {
    const doc = createDocumentWithNodes(guardrailThresholds.warn.nodeCount);
    const result = evaluateGuardrailPreflight([doc]);

    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    expect(result.errors).toHaveLength(0);
    expect(result.metrics.maxNodeCount).toBe(guardrailThresholds.warn.nodeCount);
  });

  it('blocks execution when node count reaches fail threshold', () => {
    const doc = createDocumentWithNodes(guardrailThresholds.fail.nodeCount);
    const result = evaluateGuardrailPreflight([doc]);

    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    expect(result.errors[0].message).toContain('노드 수');
    expect(result.metrics.maxNodeCount).toBe(guardrailThresholds.fail.nodeCount);
  });
});
