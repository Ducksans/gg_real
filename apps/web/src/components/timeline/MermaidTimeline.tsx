'use client';

/**
 * file: apps/web/src/components/timeline/MermaidTimeline.tsx
 * owner: duksan
 * created: 2025-09-23 07:25 UTC / 2025-09-23 16:25 KST
 * updated: 2025-09-23 09:45 UTC / 2025-09-23 18:45 KST
 * purpose: Mermaid 간트를 가독성 높은 확대/축소 컨트롤과 함께 렌더링한다
 * doc_refs: ["admin/data/timeline.events.json", "apps/web/src/lib/timeline.ts"]
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

interface MermaidTimelineProps {
  chart: string;
}

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.0;
const ZOOM_STEP = 0.05;

export function MermaidTimeline({ chart }: MermaidTimelineProps) {
  const [error, setError] = useState<string>('');
  const [scale, setScale] = useState<number>(1);
  const [hasDiagram, setHasDiagram] = useState<boolean>(false);
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const formattedScale = useMemo(() => scale.toFixed(2), [scale]);

  const applyZoom = useCallback((targetScale: number) => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const svgElement = container.querySelector('svg');
    if (!svgElement) {
      return;
    }

    const widthPercent = Math.max(10, Math.round(targetScale * 100));
    svgElement.style.width = `${widthPercent}%`;
    svgElement.style.height = 'auto';
    svgElement.style.maxWidth = 'none';
    svgElement.setAttribute('preserveAspectRatio', 'xMinYMin meet');
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function renderMermaid() {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      if (!chart) {
        container.innerHTML = '';
        setHasDiagram(false);
        return;
      }

      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'default',
          themeVariables: {
            fontSize: '16px',
            ganttAxisTextSize: '14px',
            ganttTaskFontSize: '14px',
            ganttSectionFontSize: '14px',
          },
          gantt: {
            barHeight: 28,
            barGap: 6,
            topPadding: 50,
            leftPadding: 120,
            rightPadding: 48,
          },
        });
        const { svg } = await mermaid.render(`mermaid-${id}`, chart);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError('');
          setHasDiagram(true);
          setScale(1);
          requestAnimationFrame(() => applyZoom(1));
        }
      } catch (err) {
        if (!cancelled) {
          setError('Mermaid 다이어그램을 렌더링하는 중 문제가 발생했습니다.');
          setHasDiagram(false);
          console.error(err);
        }
      }
    }

    renderMermaid();

    return () => {
      cancelled = true;
    };
  }, [chart, id, applyZoom]);

  useEffect(() => {
    if (!hasDiagram) {
      return;
    }
    applyZoom(scale);
  }, [applyZoom, hasDiagram, scale]);

  const zoomOut = () =>
    setScale((value) => Math.max(MIN_ZOOM, Math.round((value - ZOOM_STEP) * 100) / 100));
  const zoomIn = () =>
    setScale((value) => Math.min(MAX_ZOOM, Math.round((value + ZOOM_STEP) * 100) / 100));
  const resetZoom = () => setScale(1);

  if (error) {
    return (
      <div className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!chart) {
    return (
      <div className="rounded border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        표시할 이벤트가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <span className="font-semibold uppercase tracking-wide text-slate-500">확대/축소</span>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
          <button
            type="button"
            onClick={zoomOut}
            className="rounded-full border border-slate-200 px-2 py-1 font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="축소"
            disabled={!hasDiagram}
          >
            -
          </button>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={ZOOM_STEP}
            value={scale}
            onChange={(event) => setScale(Number(event.target.value))}
            className="h-1 w-36 cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-700 disabled:cursor-not-allowed"
            aria-label="타임라인 확대 비율"
            disabled={!hasDiagram}
          />
          <button
            type="button"
            onClick={zoomIn}
            className="rounded-full border border-slate-200 px-2 py-1 font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="확대"
            disabled={!hasDiagram}
          >
            +
          </button>
        </div>
        <span className="font-mono text-slate-500">x{formattedScale}</span>
        <button
          type="button"
          onClick={resetZoom}
          className="rounded-full border border-slate-200 px-2 py-1 font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hasDiagram}
        >
          초기화
        </button>
      </div>
      <div className="w-full overflow-x-auto">
        <div className="mermaid min-h-[320px]" ref={containerRef} />
      </div>
    </div>
  );
}
