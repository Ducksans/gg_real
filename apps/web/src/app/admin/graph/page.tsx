/**
 * file: apps/web/src/app/admin/graph/page.tsx
 * owner: duksan
 * created: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * updated: 2025-09-23 07:50 UTC / 2025-09-23 16:50 KST
 * purpose: 의존 그래프 JSON과 상태 구성을 React Flow 시각화에 연결
 * doc_refs: ["admin/data/graph.json", "admin/data/README.md", "admin/plan/m1-kickoff.md", "apps/web/README.md"]
 */

import { DependencyGraph } from '@/components/graph/DependencyGraph';
import { loadGraphDataset } from '@/lib/graph-data.server';

export default async function GraphPage() {
  const dataset = await loadGraphDataset();

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">의존 그래프(샘플)</h2>
        <p className="text-sm text-slate-600">{dataset.description}</p>
      </header>
      <DependencyGraph dataset={dataset} />
    </section>
  );
}
