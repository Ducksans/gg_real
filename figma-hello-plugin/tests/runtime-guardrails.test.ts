import { describe, expect, it } from 'vitest';

import type { SchemaDocument, NodeSpec } from '@schema/index';
import { evaluateGuardrails } from '@runtime/guardrails';
import { normalizeSurfaceManifest } from '@runtime/surface-config/normalizer';
import { guardrailThresholds } from '@runtime/guardrails/thresholds';

function createNodes(depth: number, breadth: number): NodeSpec[] {
  if (depth <= 0) return [];
  return Array.from({ length: breadth }, (_, index) => ({
    type: 'frame',
    name: `node-${depth}-${index}`,
    children: createNodes(depth - 1, breadth - 1),
  }));
}

describe('guardrail evaluation', () => {
  const surface = normalizeSurfaceManifest()[0];

  it('returns no warnings or errors for lightweight documents', () => {
    const doc: SchemaDocument = {
      schemaVersion: '1.0.0',
      target: {
        frameName: 'Test Frame',
        mode: 'append',
      },
      nodes: createNodes(1, 1),
    };

    const result = evaluateGuardrails(doc, 1024, surface);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    expect(result.metrics.nodeCount).toBeGreaterThan(0);
  });

  it('emits warnings when thresholds are approached', () => {
    const warnCount = guardrailThresholds.warn.nodeCount + 1;
    const nodes: NodeSpec[] = Array.from({ length: warnCount }, (_, index) => ({
      type: 'frame',
      name: `node-${index}`,
    }));

    const doc: SchemaDocument = {
      schemaVersion: '1.0.0',
      target: {
        frameName: 'Warn Frame',
        mode: 'append',
      },
      nodes,
    };

    const result = evaluateGuardrails(doc, guardrailThresholds.warn.fileSize + 1, surface);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.metrics.nodeCount).toBe(warnCount);
  });

  it('emits errors when metrics exceed fail thresholds', () => {
    const failDepth = guardrailThresholds.fail.depth + 1;
    const doc: SchemaDocument = {
      schemaVersion: '1.0.0',
      target: {
        frameName: 'Fail Frame',
        mode: 'append',
      },
      nodes: createNodes(failDepth, 1),
    };

    const result = evaluateGuardrails(doc, guardrailThresholds.fail.fileSize + 1, surface);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
