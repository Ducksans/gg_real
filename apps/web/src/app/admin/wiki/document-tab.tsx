/**
 * file: apps/web/src/app/admin/wiki/document-tab.tsx
 * owner: duksan
 * created: 2025-09-26 02:48 UTC / 2025-09-26 11:48 KST
 * purpose: 위키 문서 탭을 구성하고 관련 용어 요약을 함께 제공
 * doc_refs: ['basesettings.md', 'admin/data/wiki-glossary.json']
 */

import type { DocumentSearchResponse } from '@gg-real/documents';
import { SearchClient } from './search-client';
import { DocumentEditor, type EditableDocument } from './document-editor';
import type { GlossaryTerm } from '@/lib/glossary.server';

const CARD_CLASS =
  'rounded-lg border border-slate-300 bg-white p-4 shadow-sm space-y-3 text-sm text-slate-600';

export function DocumentTab({
  searchResults,
  documents,
  glossaryById,
}: {
  searchResults: DocumentSearchResponse;
  documents: EditableDocument[];
  glossaryById: Map<string, GlossaryTerm>;
}) {
  return (
    <div className="space-y-6">
      <SearchClient initialQuery="" initialResults={searchResults} />
      <DocumentEditor documents={documents} />
      <section className={CARD_CLASS}>
        <header className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">문서별 연결 용어</h3>
          <p className="text-xs text-slate-500">`glossary_refs` 기반으로 자동 수집</p>
        </header>
        <div className="space-y-4">
          {documents.map((doc) => (
            <article key={doc.path} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-700">{doc.label}</h4>
                <span className="text-xs text-slate-500">{doc.path}</span>
              </div>
              {doc.glossaryRefs && doc.glossaryRefs.length > 0 ? (
                <ul className="flex flex-wrap gap-2 text-xs">
                  {doc.glossaryRefs.map((termId) => {
                    const term = glossaryById.get(termId);
                    return (
                      <li
                        key={`${doc.path}-${termId}`}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1"
                        title={term?.definition ?? termId}
                      >
                        <span className="font-semibold text-slate-700">
                          {term?.title ?? termId}
                        </span>
                        {term?.beginner_explanation && (
                          <span className="ml-2 text-slate-500">
                            {truncate(term.beginner_explanation, 60)}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">연결된 용어가 아직 없습니다.</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function truncate(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}…`;
}
