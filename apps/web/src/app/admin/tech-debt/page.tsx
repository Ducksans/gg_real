/**
 * file: apps/web/src/app/admin/tech-debt/page.tsx
 * owner: duksan
 * created: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * updated: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * purpose: 기술 부채 화면의 샘플 프리뷰와 위키 연동 제공
 * doc_refs: ["admin/data/README.md", "admin/plan/m1-kickoff.md", "apps/web/README.md"]
 */

import { MarkdownContent } from '@/components/MarkdownContent';
import { loadMarkdown } from '@/lib/content';

const placeholder = `## 준비 중인 기능

- 기술 부채 카드는 M2 단계에서 실제 데이터와 연동됩니다.
- 현재는 위키에 정리된 문서를 바탕으로 논의를 이어가세요.
- 체크포인트와 연동할 항목이 생기면 이 화면에서 바로 확인할 수 있도록 연결할 예정입니다.`;

export default async function TechDebtPage() {
  const wikiDoc = await loadMarkdown('admin/data/README.md');

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">기술 부채 현황(프리뷰)</h2>
        <p className="text-sm text-slate-600">
          정식 데이터 연동 전까지는 샘플 가이드와 위키를 통해 주요 기술 부채를 확인합니다.
        </p>
      </header>
      <MarkdownContent content={placeholder} />
      <div className="rounded border border-slate-300 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-500">참고: 샘플 데이터 안내</h3>
        <MarkdownContent content={wikiDoc.content} />
      </div>
    </section>
  );
}
