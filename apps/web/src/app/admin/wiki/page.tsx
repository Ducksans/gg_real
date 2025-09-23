/**
 * file: apps/web/src/app/admin/wiki/page.tsx
 * owner: duksan
 * created: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * updated: 2025-09-23 03:35 UTC / 2025-09-23 12:35 KST
 * purpose: 샘플 위키 문서를 렌더링해 관리자 문서 뷰를 검증
 * doc_refs: ["admin/data/README.md", "admin/plan/m1-kickoff.md", "apps/web/README.md"]
 */

import { MarkdownContent } from '@/components/MarkdownContent';
import { loadMarkdown, searchDocuments } from '@/lib/content';
import { SearchClient } from './search-client';

export default async function WikiPage() {
  const doc = await loadMarkdown('admin/data/README.md');
  const initialResults = await searchDocuments({ query: '', limit: 10 });

  return (
    <section className="space-y-8">
      <header>
        <h2 className="text-2xl font-semibold">관리자 위키</h2>
        <p className="text-sm text-slate-600">
          관리자 위키 문서를 검색·탐색하고 샘플 데이터를 확인할 수 있는 화면입니다.
        </p>
      </header>
      <SearchClient initialQuery="" initialResults={initialResults} />
      <MarkdownContent content={doc.content} />
    </section>
  );
}
