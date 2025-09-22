/**
 * file: apps/web/src/app/admin/timeline/page.tsx
 * owner: duksan
 * created: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * updated: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * purpose: Mermaid 간트 샘플을 불러와 타임라인 화면을 미리보기로 제공
 * doc_refs: ["admin/data/timeline.gantt.md", "admin/plan/m1-kickoff.md", "apps/web/README.md"]
 */

import { MarkdownContent } from '@/components/MarkdownContent';
import { loadMarkdown } from '@/lib/content';

export default async function TimelinePage() {
  const doc = await loadMarkdown('admin/data/timeline.gantt.md');

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">프로젝트 타임라인(샘플)</h2>
        <p className="text-sm text-slate-600">
          아직 Mermaid 렌더러는 연결 전이지만, 샘플 텍스트를 가져와 개발 중에도 확인할 수 있습니다.
        </p>
      </header>
      <MarkdownContent content={doc.content} />
    </section>
  );
}
