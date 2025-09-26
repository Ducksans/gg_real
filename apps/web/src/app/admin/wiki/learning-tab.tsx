/**
 * file: apps/web/src/app/admin/wiki/learning-tab.tsx
 * owner: duksan
 * created: 2025-09-26 02:48 UTC / 2025-09-26 11:48 KST
 * purpose: 학습 로그 기반 최근 열람 및 학습 백로그를 보여주는 탭
 * doc_refs: ['admin/state/learning-log.json', 'admin/data/wiki-glossary.json']
 */

import type { GlossaryTerm } from '@/lib/glossary.server';
import type { LearningLogEntry } from '@/lib/learning-log.server';

const SECTION_CLASS =
  'space-y-3 rounded-lg border border-slate-300 bg-white p-4 text-sm text-slate-600 shadow-sm';

export function LearningTab({
  terms,
  entries,
}: {
  terms: GlossaryTerm[];
  entries: LearningLogEntry[];
}) {
  const termMap = new Map(terms.map((term) => [term.id, term]));
  const recent = [...entries]
    .filter((entry) => entry.lastViewed)
    .sort((a, b) => getSortKey(b.lastViewed) - getSortKey(a.lastViewed))
    .slice(0, 10);
  const backlog = entries.filter((entry) => entry.needsFollowup);
  const notes = entries
    .flatMap((entry) => entry.notes.map((note) => ({ ...note, term: entry.term })))
    .sort((a, b) => getSortKey(b.timestamp) - getSortKey(a.timestamp))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <section className={SECTION_CLASS}>
        <header className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">최근 열람한 용어</h3>
          <span className="text-xs text-slate-500">최대 10개</span>
        </header>
        {recent.length === 0 ? (
          <p className="text-xs text-slate-500">아직 열람 기록이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((entry) => {
              const term = termMap.get(entry.term);
              return (
                <li
                  key={`recent-${entry.term}`}
                  className="flex flex-col gap-1 rounded bg-slate-50 px-3 py-2"
                >
                  <span className="text-sm font-semibold text-slate-800">
                    {term?.title ?? entry.term}
                  </span>
                  {term?.definition && (
                    <span className="text-xs text-slate-500">{term.definition}</span>
                  )}
                  <span className="text-[10px] uppercase text-slate-400">{entry.lastViewed}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={SECTION_CLASS}>
        <header className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">추가로 공부할 용어</h3>
          <span className="text-xs text-slate-500">needsFollowup = true</span>
        </header>
        {backlog.length === 0 ? (
          <p className="text-xs text-slate-500">추가 학습으로 표시한 용어가 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {backlog.map((entry) => {
              const term = termMap.get(entry.term);
              return (
                <li
                  key={`backlog-${entry.term}`}
                  className="flex flex-col gap-1 rounded bg-amber-50 px-3 py-2"
                >
                  <span className="text-sm font-semibold text-amber-700">
                    {term?.title ?? entry.term}
                  </span>
                  {term?.beginner_explanation && (
                    <span className="text-xs text-amber-700/80">{term.beginner_explanation}</span>
                  )}
                  <span className="text-[10px] uppercase text-amber-600">
                    마지막 열람: {entry.lastViewed ?? '기록 없음'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={SECTION_CLASS}>
        <header className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">최근 학습 메모</h3>
          <span className="text-xs text-slate-500">최대 10개</span>
        </header>
        {notes.length === 0 ? (
          <p className="text-xs text-slate-500">작성한 학습 메모가 아직 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {notes.map((note, index) => {
              const term = termMap.get(note.term);
              return (
                <li key={`note-${note.term}-${index}`} className="rounded bg-white px-3 py-2">
                  <p className="text-sm font-semibold text-slate-800">{note.content}</p>
                  <p className="text-xs text-slate-500">
                    {term?.title ?? note.term} · {note.timestamp}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function getSortKey(value?: string): number {
  if (!value) return 0;
  const [isoPart] = value.split(' UTC');
  if (!isoPart) return 0;
  const iso = `${isoPart.replace(' ', 'T')}:00Z`;
  const date = Date.parse(iso);
  return Number.isNaN(date) ? 0 : date;
}
