/**
 * file: apps/web/src/app/admin/dashboard/page.tsx
 * owner: duksan
 * created: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * updated: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * purpose: 샘플 KPI 문서를 로드하여 관리자 대시보드를 미리보기로 제공
 * doc_refs: ["admin/data/kpi.md", "admin/plan/m1-kickoff.md", "apps/web/README.md"]
 */

import { MarkdownContent } from '@/components/MarkdownContent';
import { loadMarkdown } from '@/lib/content';

export default async function DashboardPage() {
  const kpiDoc = await loadMarkdown('admin/data/kpi.md');
  const description = kpiDoc.data.description as string | undefined;

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">대시보드 – 샘플 KPI</h2>
        {description && <p className="text-sm text-slate-600">{description}</p>}
      </header>
      <MarkdownContent content={kpiDoc.content} />
    </section>
  );
}
