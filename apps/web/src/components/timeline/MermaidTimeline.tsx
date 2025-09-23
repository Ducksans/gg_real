'use client';

/**
 * file: apps/web/src/components/timeline/MermaidTimeline.tsx
 * owner: duksan
 * created: 2025-09-23 07:25 UTC / 2025-09-23 16:25 KST
 * updated: 2025-09-23 07:56 UTC / 2025-09-23 16:56 KST
 * purpose: Mermaid 간트 문자열을 클라이언트에서 SVG로 렌더링하고 오류를 핸들링한다
 * doc_refs: ["admin/data/timeline.events.json", "apps/web/src/lib/timeline.ts"]
 */

import { useEffect, useId, useState } from 'react';

interface MermaidTimelineProps {
  chart: string;
}

export function MermaidTimeline({ chart }: MermaidTimelineProps) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const id = useId();

  useEffect(() => {
    let cancelled = false;

    async function renderMermaid() {
      if (!chart) {
        setSvg('');
        return;
      }

      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({ startOnLoad: false, theme: 'default' });
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

  return <div className="mermaid overflow-x-auto" dangerouslySetInnerHTML={{ __html: svg }} />;
}
