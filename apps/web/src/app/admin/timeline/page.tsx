/**
 * file: apps/web/src/app/admin/timeline/page.tsx
 * owner: duksan
 * created: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * updated: 2025-09-23 07:50 UTC / 2025-09-23 16:50 KST
 * purpose: SoT 기반 타임라인 데이터를 로드해 필터 가능한 간트 뷰를 제공
 * doc_refs: ["admin/data/timeline.events.json", "admin/data/README.md", "admin/plan/m1-kickoff.md", "apps/web/README.md"]
 */

import { TimelineView } from '@/components/timeline/TimelineView';
import { loadTimelineDataset } from '@/lib/timeline-data.server';

export default async function TimelinePage() {
  const dataset = await loadTimelineDataset();

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">프로젝트 타임라인(샘플)</h2>
        <p className="text-sm text-slate-600">
          Sprint 9 목표에 맞춰 상태·마일스톤 필터와 Mermaid 간트 보드를 연결했습니다.
        </p>
      </header>
      <TimelineView dataset={dataset} />
    </section>
  );
}
