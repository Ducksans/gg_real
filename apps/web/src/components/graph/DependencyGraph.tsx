'use client';

/**
 * file: apps/web/src/components/graph/DependencyGraph.tsx
 * owner: duksan
 * created: 2025-09-23 07:38 UTC / 2025-09-23 16:38 KST
 * updated: 2025-09-23 07:56 UTC / 2025-09-23 16:56 KST
 * purpose: React Flow를 이용해 의존 그래프를 시각화하고 상태·엣지 범례를 함께 제공한다
 * doc_refs: ["apps/web/src/app/admin/graph/page.tsx", "apps/web/src/lib/graph.ts"]
 */

import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

import type { GraphDatasetWithMeta } from '@/lib/graph';
import { createPositionedNodes, createStyledEdges, getEdgeLegend } from '@/lib/graph';
import { getStatusColor, getStatusLabel } from '@/lib/status';

interface DependencyGraphProps {
  dataset: GraphDatasetWithMeta;
}

export function DependencyGraph({ dataset }: DependencyGraphProps) {
  const positionedNodes = useMemo(
    () => createPositionedNodes(dataset.nodes, dataset.statuses),
    [dataset.nodes, dataset.statuses],
  );

  const styledEdges = useMemo(() => createStyledEdges(dataset.edges), [dataset.edges]);

  const nodes = useMemo(
    () =>
      positionedNodes.map((node) => ({
        id: node.id,
        data: node.data,
        position: node.position,
        style: node.style,
      })),
    [positionedNodes],
  );

  const edges = useMemo(
    () =>
      styledEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: edge.animated,
        style: edge.style,
        type: edge.type,
      })),
    [styledEdges],
  );

  return (
    <div className="space-y-4">
      <div className="h-[480px] w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          nodesConnectable={false}
          nodesDraggable={false}
          elementsSelectable={false}
          zoomOnScroll
          minZoom={0.4}
          maxZoom={1.5}
        >
          <Background color="#e2e8f0" gap={24} />
          <MiniMap pannable zoomable style={{ backgroundColor: '#f1f5f9' }} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <StatusLegend statuses={dataset.statuses} />
      <EdgeLegend />
    </div>
  );
}

interface StatusLegendProps {
  statuses: GraphDatasetWithMeta['statuses'];
}

function StatusLegend({ statuses }: StatusLegendProps) {
  const entries = useMemo(
    () => Object.keys(statuses).sort((a, b) => a.localeCompare(b)),
    [statuses],
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-700">상태 범례</h3>
      <p className="mt-1 text-xs text-slate-500">
        상태 색상은 `admin/config/status.yaml`에 정의된 팔레트를 그대로 사용합니다.
      </p>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        {entries.map((key) => (
          <span
            key={key}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: getStatusColor(statuses, key) }}
            />
            {getStatusLabel(statuses, key)}
          </span>
        ))}
      </div>
    </section>
  );
}

function EdgeLegend() {
  const entries = useMemo(() => getEdgeLegend(), []);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-700">엣지 타입</h3>
      <p className="mt-1 text-xs text-slate-500">
        선 색상과 애니메이션으로 연결 의미를 구분합니다.
      </p>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        {entries.map((entry) => (
          <span
            key={entry.type}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
          >
            <span
              className="inline-block h-2 w-6 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.label}
          </span>
        ))}
      </div>
    </section>
  );
}
