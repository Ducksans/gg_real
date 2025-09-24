/**
 * file: apps/web/src/app/admin/wiki/document-editor.tsx
 * owner: duksan
 * created: 2025-09-24 08:14 UTC / 2025-09-24 17:14 KST
 * updated: 2025-09-24 08:14 UTC / 2025-09-24 17:14 KST
 * purpose: 관리자 위키 문서를 편집/미리보기할 수 있는 클라이언트 컴포넌트
 * doc_refs: ["apps/web/src/app/admin/wiki/actions.ts", "admin/runbooks/editing.md"]
 */

'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MarkdownContent } from '@/components/MarkdownContent';
import { saveDocument } from './actions';

type DocumentEditorProps = {
  path: string;
  content: string;
  updated: string;
};

export function DocumentEditor({ path, content, updated }: DocumentEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const wordCount = useMemo(() => draft.split(/\s+/).filter(Boolean).length, [draft]);

  const onToggle = () => {
    setIsEditing((prev) => !prev);
    setError(null);
  };

  const onCancel = () => {
    setDraft(content);
    setIsEditing(false);
    setError(null);
  };

  const onSave = () => {
    startTransition(async () => {
      try {
        setError(null);
        const result = await saveDocument({ path, content: draft });
        setLastSavedAt(result.updated);
        setIsEditing(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
      }
    });
  };

  return (
    <section className="space-y-4 rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">문서 본문</h3>
          <p className="text-xs text-slate-500">경로: {path}</p>
          <p className="text-xs text-slate-500">최종 업데이트: {updated}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50"
            onClick={onToggle}
            disabled={isPending}
          >
            {isEditing ? '읽기 전환' : '편집 모드'}
          </button>
          {isEditing && (
            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50"
              onClick={onCancel}
              disabled={isPending}
            >
              되돌리기
            </button>
          )}
          {isEditing && (
            <button
              type="button"
              className="rounded bg-blue-600 px-4 py-1 text-sm font-semibold text-white hover:bg-blue-700"
              onClick={onSave}
              disabled={isPending}
            >
              {isPending ? '저장 중…' : '저장'}
            </button>
          )}
        </div>
      </header>
      {lastSavedAt && <p className="text-xs text-green-600">최근 저장: {lastSavedAt}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500">
            <span>단어 수: {wordCount}개</span>
            <span>
              CLI 플로우: <code className="rounded bg-slate-100 px-1">pnpm edit:start {path}</code>{' '}
              → 편집 후 <code className="rounded bg-slate-100 px-1">pnpm edit:prepare {path}</code>
            </span>
          </div>
          <textarea
            className="min-h-[260px] w-full rounded border border-slate-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            spellCheck={false}
          />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-700">미리보기</h4>
            <div className="rounded border border-slate-200 bg-slate-50 p-3">
              <MarkdownContent content={draft} />
            </div>
          </div>
        </div>
      ) : (
        <MarkdownContent content={content} />
      )}
    </section>
  );
}
