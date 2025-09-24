/**
 * file: apps/web/src/lib/graph.ts
 * owner: duksan
 * created: 2025-09-23 07:33 UTC / 2025-09-23 16:33 KST
 * updated: 2025-09-23 07:33 UTC / 2025-09-23 16:33 KST
 * purpose: 의존 그래프 데이터를 React Flow가 이해할 수 있는 구조로 가공하고 기본 스타일 정보를 제공한다
 * doc_refs: ["admin/data/graph.json", "apps/web/src/app/admin/graph/page.tsx"]
 */

import type { StatusConfig } from './status';
import { getStatusColor, getStatusLabel } from './status';

export type GraphNode = {
  id: string;
  type: string;
  label: string;
  status: string;
};

export type GraphEdge = {
  from: string;
  to: string;
  type: string;
};

export type GraphDataset = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  statuses: StatusConfig;
  docRefs: string[];
};

export type GraphDatasetWithMeta = GraphDataset & {
  description: string;
};

export type PositionedNode = {
  id: string;
  position: { x: number; y: number };
  data: {
    label: string;
    status: string;
    statusLabel: string;
    type: string;
  };
  style: {
    backgroundColor: string;
    color: string;
    borderRadius: number;
    padding: number;
    boxShadow: string;
    border: string;
    minWidth: number;
  };
};

export type StyledEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  type: 'default' | 'smoothstep';
  animated: boolean;
  style: {
    stroke: string;
  };
};

const EDGE_TYPE_META: Record<
  string,
  { label: string; color: string; animated: boolean; type: 'default' | 'smoothstep' }
> = {
  feeds: { label: '데이터 공급', color: '#2563eb', animated: true, type: 'smoothstep' },
  validates: { label: '검증/품질 게이트', color: '#16a34a', animated: false, type: 'default' },
};

const TYPE_ORDER = ['infra', 'data', 'app', 'ui'];

export function createPositionedNodes(
  nodes: GraphNode[],
  statuses: StatusConfig,
): PositionedNode[] {
  const columnCounts = new Map<string, number>();
  const columnWidth = 260;
  const rowHeight = 160;

  const resolvedTypeOrder = [...TYPE_ORDER];

  nodes.forEach((node) => {
    if (!resolvedTypeOrder.includes(node.type)) {
      resolvedTypeOrder.push(node.type);
    }
  });

  return nodes.map((node) => {
    const columnIndex = resolvedTypeOrder.indexOf(node.type);
    const currentRow = columnCounts.get(node.type) ?? 0;
    columnCounts.set(node.type, currentRow + 1);

    const backgroundColor = getStatusColor(statuses, node.status, '#1f2937');
    const textColor = '#ffffff';

    return {
      id: node.id,
      position: {
        x: columnIndex * columnWidth,
        y: currentRow * rowHeight,
      },
      data: {
        label: node.label,
        status: node.status,
        statusLabel: getStatusLabel(statuses, node.status),
        type: node.type,
      },
      style: {
        backgroundColor,
        color: textColor,
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.25)',
        border: '1px solid rgba(15, 23, 42, 0.2)',
        minWidth: 200,
      },
    };
  });
}

export function createStyledEdges(edges: GraphEdge[]): StyledEdge[] {
  return edges.map((edge, index) => {
    const meta = EDGE_TYPE_META[edge.type] ?? {
      label: edge.type,
      color: '#475569',
      animated: false,
      type: 'default' as const,
    };
    return {
      id: `${edge.from}-${edge.to}-${index}`,
      source: edge.from,
      target: edge.to,
      label: meta.label,
      animated: meta.animated,
      style: {
        stroke: meta.color,
      },
      type: meta.type,
    };
  });
}

export function getEdgeLegend() {
  return Object.entries(EDGE_TYPE_META).map(([type, meta]) => ({
    type,
    label: meta.label,
    color: meta.color,
  }));
}
