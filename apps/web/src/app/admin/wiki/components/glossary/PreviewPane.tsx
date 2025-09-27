/**
 * file: apps/web/src/app/admin/wiki/components/glossary/PreviewPane.tsx
 * owner: duksan
 * created: 2025-09-27 03:00 UTC / 2025-09-27 12:00 KST
 * updated: 2025-09-27 03:00 UTC / 2025-09-27 12:00 KST
 * purpose: Glossary 분할 보기의 보조 본문 영역 렌더링
 * doc_refs: ['admin/specs/wiki-glossary-learning.md']
 */

import type { GlossaryTerm } from '@/lib/glossary.server';
import { CATEGORY_LABELS } from './constants';
import { ResourceViewer } from './ResourceViewer';
import type { ViewerState } from './types';

type PreviewPaneProps = {
  mode: 'term' | 'resource' | 'empty';
  term: GlossaryTerm | null;
  resourceState: ViewerState;
  resourceKey?: string;
  isPending: boolean;
  onClearResource: () => void;
};

export function PreviewPane({
  mode,
  term,
  resourceState,
  resourceKey,
  isPending,
  onClearResource,
}: PreviewPaneProps) {
  if (mode === 'term') {
    if (!term) {
      return <p className="text-xs text-slate-500">표시할 용어가 없습니다.</p>;
    }
    return (
      <div className="space-y-3 text-[15px] leading-relaxed text-slate-950 dark:text-slate-100">
        <header className="space-y-1">
          <p className="text-[11px] uppercase text-slate-400">
            {term.categories?.map((cat) => CATEGORY_LABELS[cat] ?? cat).join(' · ')}
          </p>
          <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            {term.title}
          </h4>
          {term.definition ? (
            <p className="text-sm text-slate-500 dark:text-slate-300">{term.definition}</p>
          ) : null}
        </header>
        {term.beginner_explanation ? (
          <section className="space-y-1">
            <h5 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
              초보 설명
            </h5>
            <p>{term.beginner_explanation}</p>
          </section>
        ) : null}
        {term.related_docs && term.related_docs.length ? (
          <section className="space-y-1">
            <h5 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
              관련 문서
            </h5>
            <ul className="space-y-1">
              {term.related_docs.map((doc) => (
                <li key={doc} className="text-xs text-blue-600">
                  {doc}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    );
  }

  if (mode === 'resource') {
    const resolvedPath =
      resourceState.status === 'ready' ? resourceState.target.path : (resourceKey ?? '');
    return (
      <div className="space-y-2 text-[15px] leading-relaxed text-slate-950 dark:text-slate-100">
        <ResourceViewer
          state={resourceState}
          isPending={isPending}
          onClear={onClearResource}
          showHeader
        />
        {resolvedPath && resourceState.status !== 'ready' ? (
          <p className="text-[11px] uppercase text-slate-400 dark:text-slate-500">
            문서 · {resolvedPath}
          </p>
        ) : null}
      </div>
    );
  }

  return <p className="text-xs text-slate-500">보조 본문이 비어 있습니다.</p>;
}
