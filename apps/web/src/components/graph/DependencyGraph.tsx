'use client';

/**
 * file: apps/web/src/components/graph/DependencyGraph.tsx
 * owner: duksan
 * created: 2025-09-23 07:38 UTC / 2025-09-23 16:38 KST
 * updated: 2025-09-23 07:56 UTC / 2025-09-23 16:56 KST
 * purpose: React Flow를 이용해 의존 그래프를 시각화하고 상태·엣지 범례를 함께 제공한다
 * doc_refs: ["apps/web/src/app/admin/graph/page.tsx", "apps/web/src/lib/graph.ts", "admin/docs/ui-graph-redesign.md"]
 */

import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  MiniMap,
  ReactFlowProvider,
  type ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toPng } from 'html-to-image';

import type { GraphDatasetWithMeta } from '@/lib/graph';
import { createPositionedNodes, createStyledEdges, getEdgeLegend } from '@/lib/graph';
import { getStatusColor, getStatusLabel } from '@/lib/status';

interface DependencyGraphProps {
  dataset: GraphDatasetWithMeta;
}

const PANEL_TABS = [
  { id: 'details', label: '세부 정보' as const },
  { id: 'statuses', label: '상태 범례' as const },
  { id: 'edges', label: '엣지 타입' as const },
  { id: 'help', label: '도움말' as const },
];

export function DependencyGraph({ dataset }: DependencyGraphProps) {
  return (
    <ReactFlowProvider>
      <DependencyGraphInner dataset={dataset} />
    </ReactFlowProvider>
  );
}

function DependencyGraphInner({ dataset }: DependencyGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphCanvasRef = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selected, setSelected] = useState<null | {
    id: string;
    data: { label: string; status: string; statusLabel: string; type: string };
    style: CSSProperties;
  }>(null);
  const [activeTab, setActiveTab] = useState<(typeof PANEL_TABS)[number]['id']>('details');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const panelStateBeforeFullscreen = useRef(true);

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

  const handleExportPng = useCallback(async () => {
    const el = graphCanvasRef.current;
    if (!el) return;
    const dataUrl = await toPng(el, {
      cacheBust: true,
      backgroundColor: '#ffffff',
      pixelRatio: 2,
    });
    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '');
    a.download = `graph-${ts}.png`;
    a.href = dataUrl;
    a.click();
  }, []);

  const handleFitView = useCallback(() => {
    reactFlowInstance?.fitView({ padding: 0.2, duration: 400 });
  }, [reactFlowInstance]);

  const handleReset = useCallback(() => {
    if (!reactFlowInstance) return;
    setSelected(null);
    reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 200 });
    window.setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 200 });
    }, 220);
  }, [reactFlowInstance]);

  const handleTogglePanel = useCallback(() => {
    setIsPanelOpen((prev) => !prev);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      panelStateBeforeFullscreen.current = isPanelOpen;
      setIsPanelOpen(false);
      void el.requestFullscreen?.().catch(() => {
        // ignore
      });
    } else {
      void document.exitFullscreen?.();
    }
  }, [isPanelOpen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active) {
        setIsPanelOpen(panelStateBeforeFullscreen.current);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const canvasHeight = isFullscreen ? 'calc(100vh - 12rem)' : '620px';

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null;
      if (activeElement) {
        const tagName = activeElement.tagName;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName)) {
          return;
        }
        if (activeElement.isContentEditable) {
          return;
        }
      }

      const key = event.key.toLowerCase();
      if (event.shiftKey && key === 'f') {
        event.preventDefault();
        toggleFullscreen();
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      switch (key) {
        case 'f':
          event.preventDefault();
          handleFitView();
          break;
        case 'r':
          event.preventDefault();
          handleReset();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleFitView, handleReset, toggleFullscreen]);

  interface ToolbarAction {
    id: string;
    label: string;
    onClick: () => void;
    accelerator?: string;
    variant?: ToolbarButtonProps['variant'];
  }

  const toolbarItems: ToolbarAction[] = [
    {
      id: 'fullscreen',
      label: isFullscreen ? '전체 화면 종료' : '전체 화면',
      onClick: toggleFullscreen,
      accelerator: 'Shift+F',
    },
    { id: 'fit', label: 'Fit View', onClick: handleFitView, accelerator: 'F' },
    { id: 'reset', label: 'Reset', onClick: handleReset, accelerator: 'R' },
    { id: 'export', label: 'PNG 내보내기', onClick: handleExportPng },
    {
      id: 'panel',
      label: isPanelOpen ? '패널 숨기기' : '패널 표시',
      onClick: handleTogglePanel,
      variant: 'ghost',
    },
  ];

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col gap-4 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-950/85 p-5 backdrop-blur-sm' : ''
      }`}
    >
      <header
        className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
        data-exclude-from-export="true"
      >
        <div className="flex flex-col gap-1 text-muted-foreground">
          <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
            <span className="rounded-full border border-border px-3 py-1 text-foreground">
              의존 그래프
            </span>
            <span className="hidden text-xs font-normal sm:inline">샘플 의존 흐름</span>
          </div>
          <span className="text-xs">{dataset.description}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toolbarItems.map((item) => (
            <ToolbarButton key={item.id} variant={item.variant} onClick={item.onClick}>
              {item.label}
            </ToolbarButton>
          ))}
        </div>
      </header>

      <div
        className={`flex w-full flex-1 flex-col gap-4 lg:flex-row ${isFullscreen ? 'lg:gap-6' : ''}`}
      >
        <div
          ref={graphCanvasRef}
          className="relative flex-1 overflow-hidden rounded-lg border border-border bg-card"
          style={{ height: canvasHeight }}
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
            onInit={(instance) => setReactFlowInstance(instance)}
            onNodeClick={(_, n) => {
              setSelected({
                id: n.id,
                data: n.data as {
                  label: string;
                  status: string;
                  statusLabel: string;
                  type: string;
                },
                style: (n.style as CSSProperties) ?? {},
              });
              setActiveTab('details');
            }}
            onPaneClick={() => setSelected(null)}
          >
            <Background color="#e2e8f0" gap={24} />
            <MiniMap pannable zoomable style={{ backgroundColor: '#f1f5f9' }} />
          </ReactFlow>
        </div>

        {isPanelOpen && (
          <aside
            className="w-full shrink-0 rounded-lg border border-border bg-card p-4 text-sm text-foreground lg:w-[320px]"
            data-exclude-from-export="true"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">패널</h3>
              <button
                type="button"
                onClick={handleTogglePanel}
                className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
              >
                닫기
              </button>
            </div>
            <nav className="mt-4 flex gap-2 border-b border-border pb-2 text-xs font-medium">
              {PANEL_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-md px-3 py-1 ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <div className="mt-4 space-y-4 text-sm text-foreground">
              {activeTab === 'details' && <DetailPanel selected={selected} />}
              {activeTab === 'statuses' && <StatusLegend statuses={dataset.statuses} />}
              {activeTab === 'edges' && <EdgeLegend />}
              {activeTab === 'help' && <HelpPanel />}
            </div>
          </aside>
        )}
      </div>

      <footer
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-2 text-xs text-muted-foreground"
        data-exclude-from-export="true"
      >
        <span>
          노드 {dataset.nodes.length}개 · 엣지 {dataset.edges.length}개
        </span>
        <span>소스: admin/data/graph.json</span>
        <span className="text-muted-foreground">
          단축키: Fit View(F), Reset(R), 전체 화면(Shift+F)
        </span>
      </footer>
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

  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground">정의된 상태가 없습니다.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {entries.map((key) => (
        <span
          key={key}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 font-medium text-foreground"
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: getStatusColor(statuses, key) }}
          />
          {getStatusLabel(statuses, key)}
        </span>
      ))}
    </div>
  );
}

function EdgeLegend() {
  const entries = useMemo(() => getEdgeLegend(), []);

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {entries.map((entry) => (
        <span
          key={entry.type}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 font-medium text-foreground"
        >
          <span
            className="inline-block h-2 w-6 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.label}
        </span>
      ))}
    </div>
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
    return <p className="text-xs text-muted-foreground">노드를 클릭하면 상세 정보가 표시됩니다.</p>;
  }

  const { id, data, style } = selected;

  return (
    <div className="space-y-3 text-sm">
      <div>
        <span className="text-muted-foreground">ID</span>
        <div className="font-mono text-foreground">{id}</div>
      </div>
      <div>
        <span className="text-muted-foreground">라벨</span>
        <div className="text-foreground">{data.label}</div>
      </div>
      <div>
        <span className="text-muted-foreground">타입</span>
        <div className="text-foreground">{data.type}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">상태</span>
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: style?.backgroundColor }}
          />
          {data.statusLabel}
        </span>
      </div>
    </div>
  );
}

function HelpPanel() {
  return (
    <div className="space-y-2 text-xs text-muted-foreground">
      <p>툴바의 버튼으로 그래프를 내보내거나 전체 화면으로 전환할 수 있습니다.</p>
      <ul className="list-disc space-y-1 pl-4">
        <li>
          <span className="font-semibold text-foreground">Fit View</span> — 현재 그래프를 화면에
          맞게 재배치합니다.
        </li>
        <li>
          <span className="font-semibold text-foreground">Reset</span> — 선택을 해제하고 초기 줌으로
          복원합니다.
        </li>
        <li>
          <span className="font-semibold text-foreground">전체 화면</span> — 그래프를 전체 화면으로
          확장합니다. ESC로 종료합니다.
        </li>
      </ul>
      <p>패널은 작은 화면에서 자동으로 숨겨지며, 패널 표시 버튼으로 다시 열 수 있습니다.</p>
    </div>
  );
}

interface ToolbarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'ghost';
}

function ToolbarButton({
  variant = 'solid',
  children,
  className = '',
  ...props
}: ToolbarButtonProps) {
  const base =
    'rounded-md border border-border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400';
  const styles =
    variant === 'solid'
      ? 'bg-slate-900 text-white hover:bg-slate-700'
      : 'bg-transparent text-muted-foreground hover:bg-muted';
  return (
    <button type="button" className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}
