'use client';

import mermaid from 'mermaid';
import { useEffect, useId, useState } from 'react';

export type MermaidRendererProps = {
  code: string;
};

mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'default' });

export function MermaidRenderer({ code }: MermaidRendererProps) {
  const elementId = useId();
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const { svg: renderedSvg } = await mermaid.render(`mermaid-${elementId}`, code);
        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
        }
      }
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [code, elementId]);

  if (error) {
    return (
      <pre className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
        Mermaid 렌더링 오류: {error}
      </pre>
    );
  }

  return <div className="mermaid" dangerouslySetInnerHTML={{ __html: svg }} />;
}
