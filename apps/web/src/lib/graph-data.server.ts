/**
 * file: apps/web/src/lib/graph-data.server.ts
 * owner: duksan
 * created: 2025-09-23 07:35 UTC / 2025-09-23 16:35 KST
 * updated: 2025-09-23 07:35 UTC / 2025-09-23 16:35 KST
 * purpose: 의존 그래프 JSON과 상태 구성을 읽어 화면에 전달할 데이터셋을 구성한다
 * doc_refs: ["admin/data/graph.json", "admin/config/status.yaml", "apps/web/src/app/admin/graph/page.tsx"]
 */

import { loadJson } from './content';
import { loadStatusConfig } from './status.server';
import type { GraphDatasetWithMeta, GraphEdge, GraphNode } from './graph';

interface GraphDataFile {
  doc_refs?: string[];
  description?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export async function loadGraphDataset(): Promise<GraphDatasetWithMeta> {
  const [statusConfig, graph] = await Promise.all([
    loadStatusConfig(),
    loadJson<GraphDataFile>('admin/data/graph.json'),
  ]);

  return {
    nodes: graph.nodes,
    edges: graph.edges,
    statuses: statusConfig,
    description: graph.description ?? '의존 관계 개요',
    docRefs: graph.doc_refs ?? [],
  };
}
