import { guardrailThresholds, measureNodeGraph } from '../../shared/guardrails';
import type { SchemaDocument } from '../../schema';

export type GuardrailPreflightIssueKind = 'node-count' | 'depth' | 'file-size';

export interface GuardrailPreflightIssue {
  readonly kind: GuardrailPreflightIssueKind;
  readonly severity: 'warning' | 'error';
  readonly message: string;
  readonly sectionId?: string;
}

export interface GuardrailPreflightMetrics {
  readonly maxNodeCount: number;
  readonly maxDepth: number;
  readonly maxFileSize: number;
}

export interface GuardrailPreflightResult {
  readonly warnings: GuardrailPreflightIssue[];
  readonly errors: GuardrailPreflightIssue[];
  readonly metrics: GuardrailPreflightMetrics;
}

const formatLabel = (doc: SchemaDocument): string => {
  const title = doc.meta?.title?.trim();
  if (title) return title;
  const section = doc.meta?.section?.trim();
  if (section) return section;
  const description = doc.meta?.description?.trim();
  if (description) return description;
  return '선택 항목';
};

const withLabel = (label: string, message: string) => (label ? `[${label}] ${message}` : message);

export const evaluateGuardrailPreflight = (
  documents: SchemaDocument[],
): GuardrailPreflightResult => {
  const warnings: GuardrailPreflightIssue[] = [];
  const errors: GuardrailPreflightIssue[] = [];

  let maxNodeCount = 0;
  let maxDepth = 0;
  let maxFileSize = 0;

  documents.forEach((doc) => {
    const label = formatLabel(doc);
    const serialized = JSON.stringify(doc);
    const { count, maxDepth: depth } = measureNodeGraph(doc.nodes ?? []);
    const fileSize = serialized.length;

    maxNodeCount = Math.max(maxNodeCount, count);
    maxDepth = Math.max(maxDepth, depth);
    maxFileSize = Math.max(maxFileSize, fileSize);

    if (count >= guardrailThresholds.fail.nodeCount) {
      errors.push({
        kind: 'node-count',
        severity: 'error',
        message: withLabel(label, `노드 수(${count})가 허용치를 초과했습니다. 섹션을 분할하세요.`),
        sectionId: doc.meta?.section ?? undefined,
      });
    } else if (count >= guardrailThresholds.warn.nodeCount) {
      warnings.push({
        kind: 'node-count',
        severity: 'warning',
        message: withLabel(label, `노드 수가 많습니다(${count}). 섹션 분할을 고려하세요.`),
        sectionId: doc.meta?.section ?? undefined,
      });
    }

    if (depth >= guardrailThresholds.fail.depth) {
      errors.push({
        kind: 'depth',
        severity: 'error',
        message: withLabel(label, `중첩 수준(${depth})이 너무 깊습니다. 레이아웃을 단순화하세요.`),
        sectionId: doc.meta?.section ?? undefined,
      });
    } else if (depth >= guardrailThresholds.warn.depth) {
      warnings.push({
        kind: 'depth',
        severity: 'warning',
        message: withLabel(label, `중첩 수준이 높습니다(${depth}). 구조를 점검하세요.`),
        sectionId: doc.meta?.section ?? undefined,
      });
    }

    if (fileSize >= guardrailThresholds.fail.fileSize) {
      errors.push({
        kind: 'file-size',
        severity: 'error',
        message: withLabel(
          label,
          `JSON 크기(${Math.round(fileSize / 1024)}KB)가 허용치를 초과했습니다.`,
        ),
        sectionId: doc.meta?.section ?? undefined,
      });
    } else if (fileSize >= guardrailThresholds.warn.fileSize) {
      warnings.push({
        kind: 'file-size',
        severity: 'warning',
        message: withLabel(label, `JSON 크기가 큽니다(${Math.round(fileSize / 1024)}KB).`),
        sectionId: doc.meta?.section ?? undefined,
      });
    }
  });

  return {
    warnings,
    errors,
    metrics: {
      maxNodeCount,
      maxDepth,
      maxFileSize,
    },
  };
};
