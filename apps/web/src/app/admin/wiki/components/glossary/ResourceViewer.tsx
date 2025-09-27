/**
 * file: apps/web/src/app/admin/wiki/components/glossary/ResourceViewer.tsx
 * owner: duksan
 * created: 2025-09-27 02:59 UTC / 2025-09-27 11:59 KST
 * updated: 2025-09-27 02:59 UTC / 2025-09-27 11:59 KST
 * purpose: Glossary에서 문서/파일 콘텐츠를 렌더링하는 뷰어 컴포넌트
 * doc_refs: ['admin/specs/wiki-glossary-learning.md']
 */

import { MarkdownContent } from '@/components/MarkdownContent';
import type { ViewerState } from './types';

type ResourceViewerProps = {
  state: ViewerState;
  onClear: () => void;
  isPending: boolean;
  showHeader?: boolean;
};

export function ResourceViewer({
  state,
  onClear,
  isPending,
  showHeader = true,
}: ResourceViewerProps) {
  if (state.status === 'idle') {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-400">
        문서나 파일을 선택하면 내용이 표시됩니다.
      </p>
    );
  }

  if (state.status === 'loading' || isPending) {
    return <p className="text-xs text-slate-500 dark:text-slate-400">불러오는 중입니다…</p>;
  }

  if (state.status === 'error') {
    return (
      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-200">
        <p className="text-red-600 dark:text-red-400">
          미리보기를 불러오지 못했습니다: {state.message}
        </p>
        <button
          type="button"
          onClick={onClear}
          className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          초기화
        </button>
      </div>
    );
  }

  const { target, kind, content, frontmatter } = state;
  const updated = typeof frontmatter?.updated === 'string' ? frontmatter.updated : null;
  const title =
    typeof frontmatter?.title === 'string' && frontmatter.title.trim().length > 0
      ? frontmatter.title
      : target.name;

  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-slate-800 dark:text-slate-100">
      {showHeader ? (
        <header className="space-y-1">
          <p className="text-[10px] uppercase text-slate-400 dark:text-slate-500">
            {target.source === 'doc' ? '문서' : '파일'} · {target.path}
          </p>
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h4>
            <button
              type="button"
              onClick={onClear}
              className="rounded-full border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              닫기
            </button>
          </div>
          {updated ? (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              최종 업데이트: {updated}
            </p>
          ) : null}
        </header>
      ) : null}
      <div className="overflow-auto rounded border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        {kind === 'markdown' ? (
          <MarkdownContent content={content} />
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-700 dark:text-slate-200">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}
