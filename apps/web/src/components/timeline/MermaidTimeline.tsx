'use client';

/**
 * file: apps/web/src/components/timeline/MermaidTimeline.tsx
 * owner: duksan
 * created: 2025-09-23 07:25 UTC / 2025-09-23 16:25 KST
 * updated: 2025-09-23 09:27 UTC / 2025-09-23 18:27 KST
 * purpose: Mermaid 간트 문자열을 확대/축소 컨트롤과 함께 렌더링한다
 * doc_refs: ["admin/data/timeline.events.json", "apps/web/src/lib/timeline.ts"]
 */

import { useEffect, useId, useMemo, useState } from 'react';

interface MermaidTimelineProps {
  chart: string;
}

export function MermaidTimeline({ chart }: MermaidTimelineProps) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [scale, setScale] = useState<number>(1);
  const id = useId();

  const formattedScale = useMemo(() => scale.toFixed(2), [scale]);

  useEffect(() => {
    let cancelled = false;

    async function renderMermaid() {
      if (!chart) {
        setSvg('');
        return;
      }

      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          gantt: {
            barHeight: 30,
            barGap: 8,
            topPadding: 60,
            leftPadding: 80,
            rightPadding: 40,
          },
        });
        const { svg } = await mermaid.render(`mermaid-${id}`, chart);
        if (!cancelled) {
          setSvg(svg);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError('Mermaid 다이어그램을 렌더링하는 중 문제가 발생했습니다.');
          console.error(err);
        }
      }
    }

    renderMermaid();

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

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

  const zoomOut = () => setScale((value) => Math.max(0.6, Math.round((value - 0.1) * 100) / 100));
  const zoomIn = () => setScale((value) => Math.min(1.8, Math.round((value + 0.1) * 100) / 100));
  const resetZoom = () => setScale(1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <span className="font-semibold uppercase tracking-wide text-slate-500">확대/축소</span>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
          <button
            type="button"
            onClick={zoomOut}
            className="rounded-full border border-slate-200 px-2 py-1 font-semibold text-slate-600 transition hover:bg-slate-100"
            aria-label="축소"
          >
            -
          </button>
          <input
            type="range"
            min={0.6}
            max={1.8}
            step={0.05}
            value={scale}
            onChange={(event) => setScale(Number(event.target.value))}
            className="h-1 w-36 cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-700"
            aria-label="타임라인 확대 비율"
          />
          <button
            type="button"
            onClick={zoomIn}
            className="rounded-full border border-slate-200 px-2 py-1 font-semibold text-slate-600 transition hover:bg-slate-100"
            aria-label="확대"
          >
            +
          </button>
        </div>
        <span className="font-mono text-slate-500">x{formattedScale}</span>
        <button
          type="button"
          onClick={resetZoom}
          className="rounded-full border border-slate-200 px-2 py-1 font-medium text-slate-600 transition hover:bg-slate-100"
        >
          초기화
        </button>
      </div>
      <div className="overflow-x-auto">
        <div
          className="mermaid inline-block origin-top-left"
          style={{ transform: `scale(${scale})` }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}
