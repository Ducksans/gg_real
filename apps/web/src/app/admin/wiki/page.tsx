/**
 * file: apps/web/src/app/admin/wiki/page.tsx
 * owner: duksan
 * created: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * updated: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * purpose: 샘플 위키 문서를 렌더링해 관리자 문서 뷰를 검증
 * doc_refs: ["admin/data/README.md", "admin/plan/m1-kickoff.md", "apps/web/README.md"]
 */

import { MarkdownContent } from '@/components/MarkdownContent';
import { loadMarkdown } from '@/lib/content';

export default async function WikiPage() {
  const doc = await loadMarkdown('admin/data/README.md');

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">관리자 위키</h2>
        <p className="text-sm text-slate-600">샘플 데이터 문서를 로드하는 화면입니다.</p>
      </header>
      <MarkdownContent content={doc.content} />
    </section>
  );
}
