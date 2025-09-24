'use client';

/**
 * file: apps/web/src/components/graph/DependencyGraph.tsx
 * owner: duksan
 * created: 2025-09-23 07:38 UTC / 2025-09-23 16:38 KST
 * updated: 2025-09-23 07:56 UTC / 2025-09-23 16:56 KST
 * purpose: React Flow를 이용해 의존 그래프를 시각화하고 상태·엣지 범례를 함께 제공한다
 * doc_refs: ["apps/web/src/app/admin/graph/page.tsx", "apps/web/src/lib/graph.ts"]
 */

import { type CSSProperties, useCallback, useMemo, useRef, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { toPng } from 'html-to-image';

import type { GraphDatasetWithMeta } from '@/lib/graph';
import { createPositionedNodes, createStyledEdges, getEdgeLegend } from '@/lib/graph';
import { getStatusColor, getStatusLabel } from '@/lib/status';

interface DependencyGraphProps {
  dataset: GraphDatasetWithMeta;
}

export function DependencyGraph({ dataset }: DependencyGraphProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<null | {
    id: string;
    data: { label: string; status: string; statusLabel: string; type: string };
    style: CSSProperties;
  }>(null);
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

  const onExportPng = useCallback(async () => {
    const el = wrapperRef.current;
    if (!el) return;
    const dataUrl = await toPng(el, {
      cacheBust: true,
      backgroundColor: '#ffffff',
      pixelRatio: 2,
      filter: (node) => {
        // Exclude the right detail panel and control row
        if (node instanceof HTMLElement && node.dataset?.excludeFromExport === 'true') {
          return false;
        }
        return true;
      },
    });
    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '');
    a.download = `graph-${ts}.png`;
    a.href = dataUrl;
    a.click();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide text-muted-foreground">
            그래프
          </span>
          <button
            type="button"
            onClick={onExportPng}
            className="rounded-full border border-border px-2 py-1 font-medium hover:bg-muted"
          >
            PNG 내보내기
          </button>
        </div>
        {selected && (
          <div className="text-muted-foreground">
            선택됨: <span className="font-mono">{selected.id}</span>
          </div>
        )}
      </div>
      <div className="flex w-full gap-4">
        <div
          ref={wrapperRef}
          className="h-[480px] w-full overflow-hidden rounded-lg border border-border bg-card"
        >
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
            onNodeClick={(_, n) =>
              setSelected({
                id: n.id,
                data: n.data as {
                  label: string;
                  status: string;
                  statusLabel: string;
                  type: string;
                },
                style: (n.style as CSSProperties) ?? {},
              })
            }
            onPaneClick={() => setSelected(null)}
          >
            <Background color="#e2e8f0" gap={24} />
            <MiniMap pannable zoomable style={{ backgroundColor: '#f1f5f9' }} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
        <aside
          className="hidden w-[320px] shrink-0 rounded-lg border border-slate-200 bg-white p-4 lg:block"
          data-exclude-from-export="true"
        >
          <DetailPanel selected={selected} />
        </aside>
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
    <section className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">상태 범례</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        상태 색상은 `admin/config/status.yaml`에 정의된 팔레트를 그대로 사용합니다.
      </p>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        {entries.map((key) => (
          <span
            key={key}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground"
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
    <section className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">엣지 타입</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        선 색상과 애니메이션으로 연결 의미를 구분합니다.
      </p>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        {entries.map((entry) => (
          <span
            key={entry.type}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground"
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

interface DetailPanelProps {
  selected: null | {
    id: string;
    data: { label: string; status: string; statusLabel: string; type: string };
    style: { backgroundColor?: string };
  };
}

function DetailPanel({ selected }: DetailPanelProps) {
  if (!selected) {
    return (
      <div className="text-sm text-muted-foreground">노드를 클릭하면 상세 정보가 표시됩니다.</div>
    );
  }

  const { id, data, style } = selected;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">노드 상세</h3>
      <div className="space-y-1 text-sm">
        <div>
          <span className="text-muted-foreground">ID: </span>
          <span className="font-mono text-foreground">{id}</span>
        </div>
        <div>
          <span className="text-muted-foreground">라벨: </span>
          <span className="text-foreground">{data.label}</span>
        </div>
        <div>
          <span className="text-muted-foreground">타입: </span>
          <span className="text-foreground">{data.type}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">상태: </span>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: style?.backgroundColor }}
            />
            {data.statusLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
