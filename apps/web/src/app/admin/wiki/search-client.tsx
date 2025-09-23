/**
 * file: apps/web/src/app/admin/wiki/search-client.tsx
 * owner: duksan
 * created: 2025-09-23 03:33 UTC / 2025-09-23 12:33 KST
 * updated: 2025-09-23 03:35 UTC / 2025-09-23 12:35 KST
 * purpose: 사용자 입력 기반 문서 검색 UI와 결과 표시 컴포넌트 제공
 * doc_refs: ["basesettings.md", "admin/plan/m1-kickoff.md", "apps/web/README.md"]
 */

'use client';

import { useState, useTransition, type FormEvent } from 'react';
import type { DocumentSearchResponse, DocumentSearchMatch } from '@gg-real/documents';

type SearchClientProps = {
  initialQuery: string;
  initialResults: DocumentSearchResponse;
};

const DEFAULT_LIMIT = 10;

export function SearchClient({ initialQuery, initialResults }: SearchClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<DocumentSearchResponse>(initialResults);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runSearch = (value: string) => {
    startTransition(async () => {
      setError(null);
      try {
        const params = new URLSearchParams();
        if (value.trim().length > 0) {
          params.set('q', value.trim());
        }
        params.set('limit', String(DEFAULT_LIMIT));
        const response = await fetch(`/api/documents/search?${params.toString()}`);
        if (!response.ok) {
          throw new Error('검색 요청이 실패했습니다.');
        }
        const payload = (await response.json()) as DocumentSearchResponse;
        setResults(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      }
    });
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runSearch(query);
  };

  const onClear = () => {
    setQuery('');
    runSearch('');
  };

  return (
    <div className="space-y-4 rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <form className="flex flex-col gap-3 md:flex-row" onSubmit={onSubmit}>
        <div className="flex-1">
          <label className="sr-only" htmlFor="doc-search-input">
            문서 검색어
          </label>
          <input
            id="doc-search-input"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="검색어를 입력하세요 (예: checkpoint, sprint, 관측)"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            disabled={isPending}
          >
            {isPending ? '검색 중…' : '검색'}
          </button>
          <button
            type="button"
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            onClick={onClear}
            disabled={isPending || query.length === 0}
          >
            초기화
          </button>
        </div>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <SearchSummary results={results} isLoading={isPending} />
      <ResultList matches={results.results} />
    </div>
  );
}

function SearchSummary({
  results,
  isLoading,
}: {
  results: DocumentSearchResponse;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <p className="text-sm text-slate-500">검색 중입니다…</p>;
  }
  if (results.total === 0) {
    return (
      <p className="text-sm text-slate-500">검색 결과가 없습니다. 다른 키워드를 시도해 보세요.</p>
    );
  }
  return (
    <p className="text-sm text-slate-600">
      총 <span className="font-semibold">{results.total}</span>건의 문서를 찾았습니다.
    </p>
  );
}

function ResultList({ matches }: { matches: DocumentSearchMatch[] }) {
  if (matches.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-4">
      {matches.map((match) => (
        <li key={match.path} className="rounded border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-800">{match.title}</h3>
            <span className="text-xs uppercase text-slate-500">
              {match.status ?? 'status 미정'}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">{match.description ?? '설명 없음'}</p>
          <p className="mt-3 text-sm text-slate-700">{match.snippet}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">
              {match.path}
            </span>
            {match.tags.length > 0 && <span>태그: {match.tags.join(', ')}</span>}
            {match.updated && <span>업데이트: {match.updated}</span>}
          </div>
          {match.backlinks.length > 0 && (
            <div className="mt-3 text-xs text-slate-600">
              <span className="font-medium">백링크:</span> {match.backlinks.join(', ')}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
