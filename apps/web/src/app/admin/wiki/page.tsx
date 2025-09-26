/**
 * file: apps/web/src/app/admin/wiki/page.tsx
 * owner: duksan
 * created: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * updated: 2025-09-23 03:35 UTC / 2025-09-23 12:35 KST
 * purpose: 샘플 위키 문서를 렌더링해 관리자 문서 뷰를 검증
 * doc_refs: ["admin/data/README.md", "admin/plan/m1-kickoff.md", "apps/web/README.md", "admin/design/wiki-glossary-wireframe.md"]
 */

import Link from 'next/link';
import { loadMarkdown, searchDocuments } from '@/lib/content';
import { loadGlossary, createGlossaryIndex } from '@/lib/glossary.server';
import { loadLearningLog } from '@/lib/learning-log.server';
import { editableDocs } from './editable-docs';
import { DocumentTab } from './document-tab';
import { GlossaryTab } from './glossary-tab';
import { LearningTab } from './learning-tab';

type WikiPageProps = {
  searchParams?: Promise<Record<string, string | string[]>>;
};

export default async function WikiPage({ searchParams }: WikiPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const tabParamRaw = resolvedSearchParams?.tab;
  const activeTabParam = Array.isArray(tabParamRaw) ? tabParamRaw[0] : tabParamRaw;
  const activeTab =
    activeTabParam === 'glossary' || activeTabParam === 'learning' ? activeTabParam : 'documents';

  const [glossary, learningLog] = await Promise.all([loadGlossary(), loadLearningLog()]);
  const glossaryIndex = createGlossaryIndex(glossary.terms);

  const editableDocDetails = await Promise.all(
    editableDocs.map(async (doc) => {
      const loaded = await loadMarkdown(doc.path);
      const frontmatter = loaded.data ?? {};
      const glossaryRefs = Array.isArray(frontmatter.glossary_refs)
        ? frontmatter.glossary_refs.map((ref: unknown) => String(ref))
        : [];
      return {
        path: doc.path,
        label: doc.label,
        content: loaded.content,
        updated: frontmatter.updated ?? '',
        glossaryRefs,
      };
    }),
  );

  const initialResults = await searchDocuments({ query: '', limit: 10 });
  const learningEntryMap = Object.fromEntries(
    learningLog.entries.map((entry) => [entry.term, entry]),
  );

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold">관리자 위키</h2>
        <p className="text-sm text-slate-600">
          프로젝트 문서를 탐색하고, 용어 사전을 통해 필요한 개념을 학습하며, 학습 로그를 관리할 수
          있는 화면입니다.
        </p>
      </header>
      <TabNavigation activeTab={activeTab} />
      {activeTab === 'glossary' ? (
        <GlossaryTab terms={glossary.terms} learningEntries={learningEntryMap} />
      ) : activeTab === 'learning' ? (
        <LearningTab terms={glossary.terms} entries={learningLog.entries} />
      ) : (
        <DocumentTab
          documents={editableDocDetails}
          searchResults={initialResults}
          glossaryById={glossaryIndex}
        />
      )}
    </section>
  );
}

function TabNavigation({ activeTab }: { activeTab: string }) {
  const tabs = [
    { id: 'documents', label: '문서' },
    { id: 'glossary', label: '용어 사전' },
    { id: 'learning', label: '학습 기록' },
  ] as const;

  return (
    <nav className="flex flex-wrap items-center gap-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const search = tab.id === 'documents' ? '' : `?tab=${tab.id}`;
        return (
          <Link
            key={tab.id}
            href={`/admin/wiki${search}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              isActive
                ? 'bg-slate-900 text-white shadow'
                : 'border border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
