/**
 * file: apps/web/src/app/admin/wiki/document-editor.tsx
 * owner: duksan
 * created: 2025-09-24 08:14 UTC / 2025-09-24 17:14 KST
 * updated: 2025-09-24 08:22 UTC / 2025-09-24 17:22 KST
 * purpose: 관리자 위키 문서를 편집/미리보기할 수 있는 클라이언트 컴포넌트
 * doc_refs: ["apps/web/src/app/admin/wiki/actions.ts", "admin/runbooks/editing.md", "apps/web/src/app/admin/wiki/editable-docs.ts", "basesettings.md"]
 */

'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MarkdownContent } from '@/components/MarkdownContent';
import { saveDocument } from './actions';

export type EditableDocument = {
  path: string;
  label: string;
  content: string;
  updated: string;
};

type DocumentEditorProps = {
  documents: EditableDocument[];
};

export function DocumentEditor({ documents }: DocumentEditorProps) {
  const router = useRouter();
  const initialPath = documents[0]?.path ?? '';

  const docMap = useMemo(
    () =>
      new Map(
        documents.map((doc) => [
          doc.path,
          { label: doc.label, content: doc.content, updated: doc.updated },
        ]),
      ),
    [documents],
  );

  const [selectedPath, setSelectedPath] = useState(initialPath);
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(documents.map((doc) => [doc.path, doc.content])),
  );
  const [updatedMap, setUpdatedMap] = useState<Record<string, string>>(() =>
    Object.fromEntries(documents.map((doc) => [doc.path, doc.updated])),
  );
  const [lastSavedMap, setLastSavedMap] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(documents.map((doc) => [doc.path, null])),
  );
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedDraft = drafts[selectedPath] ?? '';
  const selectedUpdated = updatedMap[selectedPath] ?? docMap.get(selectedPath)?.updated ?? '';
  const lastSavedAt = lastSavedMap[selectedPath] ?? null;
  const wordCount = useMemo(
    () => selectedDraft.split(/\s+/).filter(Boolean).length,
    [selectedDraft],
  );

  const onSelectDoc = (path: string) => {
    setSelectedPath(path);
    setIsEditing(false);
    setError(null);
  };

  const onToggle = () => {
    if (!selectedPath) return;
    setIsEditing((prev) => !prev);
    setError(null);
  };

  const onCancel = () => {
    if (!selectedPath) return;
    const original = docMap.get(selectedPath)?.content ?? '';
    setDrafts((prev) => ({ ...prev, [selectedPath]: original }));
    setIsEditing(false);
    setError(null);
  };

  const onSave = () => {
    if (!selectedPath) return;
    startTransition(async () => {
      try {
        setError(null);
        const draft = drafts[selectedPath] ?? '';
        const result = await saveDocument({ path: selectedPath, content: draft });
        setUpdatedMap((prev) => ({ ...prev, [selectedPath]: result.updated }));
        setLastSavedMap((prev) => ({ ...prev, [selectedPath]: result.updated }));
        setIsEditing(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
      }
    });
  };

  if (documents.length === 0) {
    return (
      <section className="rounded-lg border border-slate-300 bg-white p-4 text-sm text-slate-600 shadow-sm">
        편집 가능한 문서가 없습니다. `editable-docs.ts`를 업데이트하세요.
      </section>
    );
  }

  const selectedLabel = docMap.get(selectedPath)?.label ?? selectedPath;

  return (
    <section className="space-y-4 rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-800">문서 본문</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <label className="font-medium" htmlFor="editable-doc-select">
              문서 선택
            </label>
            <select
              id="editable-doc-select"
              className="rounded border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
              value={selectedPath}
              onChange={(event) => onSelectDoc(event.target.value)}
            >
              {documents.map((doc) => (
                <option key={doc.path} value={doc.path}>
                  {doc.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-500">경로: {selectedPath}</p>
          <p className="text-xs text-slate-500">최종 업데이트: {selectedUpdated}</p>
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
      <p className="text-xs text-slate-500">현재 문서: {selectedLabel}</p>
      {lastSavedAt && <p className="text-xs text-green-600">최근 저장: {lastSavedAt}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500">
            <span>단어 수: {wordCount}개</span>
            <span>
              CLI 플로우:{' '}
              <code className="rounded bg-slate-100 px-1">pnpm edit:start {selectedPath}</code> →
              편집 후{' '}
              <code className="rounded bg-slate-100 px-1">pnpm edit:prepare {selectedPath}</code>
            </span>
          </div>
          <textarea
            className="min-h-[260px] w-full rounded border border-slate-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
            value={selectedDraft}
            onChange={(event) =>
              setDrafts((prev) => ({ ...prev, [selectedPath]: event.target.value }))
            }
            spellCheck={false}
          />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-700">미리보기</h4>
            <div className="rounded border border-slate-200 bg-slate-50 p-3">
              <MarkdownContent content={selectedDraft} />
            </div>
          </div>
        </div>
      ) : (
        <MarkdownContent content={selectedDraft} />
      )}
    </section>
  );
}
