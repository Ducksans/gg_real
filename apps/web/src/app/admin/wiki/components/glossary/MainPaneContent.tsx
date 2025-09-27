/**
 * file: apps/web/src/app/admin/wiki/components/glossary/MainPaneContent.tsx
 * owner: duksan
 * created: 2025-09-27 03:00 UTC / 2025-09-27 12:00 KST
 * updated: 2025-09-27 03:00 UTC / 2025-09-27 12:00 KST
 * purpose: Glossary 분할 보기의 메인 본문 영역 렌더링
 * doc_refs: ['admin/specs/wiki-glossary-learning.md']
 */

import type { RefObject } from 'react';
import { AnnotationLayer } from '@/components/wiki/AnnotationLayer';
import type { Annotation } from '@/hooks/useAnnotations';
import type { GlossaryTerm } from '@/lib/glossary.server';
import { CATEGORY_LABELS } from './constants';
import { ResourceViewer } from './ResourceViewer';
import type { OutlineSection, ViewerState } from './types';

type MainPaneContentProps = {
  mode: 'term' | 'resource';
  term: GlossaryTerm | null;
  annotations: Annotation[];
  contentRef: RefObject<HTMLDivElement>;
  outlineSections: OutlineSection[];
  resourceState: ViewerState;
  resourceKey: string | null;
  isPending: boolean;
  onClearResource: () => void;
};

export function MainPaneContent({
  mode,
  term,
  annotations,
  contentRef,
  outlineSections,
  resourceState,
  resourceKey,
  isPending,
  onClearResource,
}: MainPaneContentProps) {
  if (mode === 'resource') {
    if (resourceState.status === 'idle') {
      return <p className="text-xs text-slate-500">문서를 선택하면 내용이 표시됩니다.</p>;
    }
    const resolvedPath =
      resourceState.status === 'ready' ? resourceState.target.path : (resourceKey ?? '');
    const resolvedName =
      resourceState.status === 'ready' ? resourceState.target.name : (resourceKey ?? '문서 보기');
    return (
      <AnnotationLayer annotations={annotations}>
        <div
          ref={contentRef}
          data-content-root
          className="space-y-4 text-slate-950 dark:text-slate-100"
        >
          <header className="space-y-1 border-b border-slate-200 pb-2">
            <p className="text-[11px] uppercase text-slate-400 dark:text-slate-500">
              문서 · {resolvedPath}
            </p>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {resolvedName}
              </h2>
              <button
                type="button"
                onClick={onClearResource}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                닫기
              </button>
            </div>
          </header>
          <div className="space-y-3 text-sm text-slate-950 dark:text-slate-100">
            <ResourceViewer
              state={resourceState}
              isPending={isPending}
              onClear={onClearResource}
              showHeader={false}
            />
          </div>
        </div>
      </AnnotationLayer>
    );
  }

  if (!term) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        학습할 용어를 선택하면 본문이 표시됩니다.
      </div>
    );
  }

  return (
    <AnnotationLayer annotations={annotations}>
      <article ref={contentRef} className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase text-slate-400">
            {term.categories?.map((cat) => CATEGORY_LABELS[cat] ?? cat).join(' · ')}
          </p>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {term.title}
          </h2>
          {term.definition ? (
            <p className="text-base text-slate-600 dark:text-slate-300">{term.definition}</p>
          ) : null}
        </header>
        {outlineSections.map((section) => (
          <section key={section.id} id={section.id} className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {section.title}
            </h3>
            {section.description ? (
              <p className="text-sm text-slate-500 dark:text-slate-300">{section.description}</p>
            ) : null}
            <div className="space-y-3 text-sm text-slate-950 dark:text-slate-100">
              {section.content}
            </div>
          </section>
        ))}
      </article>
    </AnnotationLayer>
  );
}
