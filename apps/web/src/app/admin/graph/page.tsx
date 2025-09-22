/**
 * file: apps/web/src/app/admin/graph/page.tsx
 * owner: duksan
 * created: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * updated: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * purpose: 의존 그래프 샘플 JSON을 시각화 레이아웃에 매핑
 * doc_refs: ["admin/data/graph.json", "admin/plan/m1-kickoff.md", "apps/web/README.md"]
 */

import { loadJson } from '@/lib/content';

type GraphDoc = {
  description: string;
  nodes: Array<{ id: string; type: string; label: string; status: string }>;
  edges: Array<{ from: string; to: string; type: string }>;
};

export default async function GraphPage() {
  const graph = await loadJson<GraphDoc>('admin/data/graph.json');

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">의존 그래프(샘플)</h2>
        <p className="text-sm text-slate-600">{graph.description}</p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-slate-300 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Nodes
          </h3>
          <ul className="space-y-2 text-sm">
            {graph.nodes.map((node) => (
              <li
                key={node.id}
                className="flex items-center justify-between border-b border-slate-200 pb-1 last:border-b-0 last:pb-0"
              >
                <span className="font-medium">{node.label}</span>
                <span className="text-xs uppercase text-slate-500">{node.status}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-slate-300 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Edges
          </h3>
          <ul className="space-y-2 text-sm">
            {graph.edges.map((edge, index) => (
              <li
                key={`${edge.from}-${edge.to}-${index}`}
                className="flex items-center justify-between border-b border-slate-200 pb-1 last:border-b-0 last:pb-0"
              >
                <span>
                  {edge.from} → {edge.to}
                </span>
                <span className="text-xs uppercase text-slate-500">{edge.type}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <details className="rounded border border-slate-300 bg-white p-4 text-sm">
        <summary className="cursor-pointer font-medium">Raw JSON 보기</summary>
        <pre className="mt-3 whitespace-pre-wrap text-xs text-slate-700">
          {JSON.stringify(graph, null, 2)}
        </pre>
      </details>
    </section>
  );
}
