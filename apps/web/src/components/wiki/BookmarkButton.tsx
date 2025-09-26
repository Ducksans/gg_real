'use client';

import { useMemo } from 'react';
import { useReadingProgress } from '@/hooks/useReadingProgress';

type BookmarkButtonProps = {
  docId: string;
};

export function BookmarkButton({ docId }: BookmarkButtonProps) {
  const { lastHeadingId, bookmarkHeading, clearBookmark } = useReadingProgress(docId, {
    autoScroll: false,
  });

  const label = useMemo(() => (lastHeadingId ? '책갈피 제거' : '여기까지 읽음'), [lastHeadingId]);

  return (
    <button
      type="button"
      className="flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
      onClick={() => {
        if (lastHeadingId) {
          clearBookmark();
        } else {
          const activeHeading = document.elementFromPoint(
            window.innerWidth / 2,
            window.innerHeight * 0.2,
          );
          let headingId: string | null = null;
          if (activeHeading instanceof HTMLElement && activeHeading.id) {
            headingId = activeHeading.id;
          }
          if (!headingId) {
            const headings = Array.from(document.querySelectorAll('h2, h3, h4')) as HTMLElement[];
            headingId = headings.find((heading) => {
              const rect = heading.getBoundingClientRect();
              return rect.top >= 0 && rect.top < window.innerHeight * 0.5;
            })?.id;
          }
          if (headingId) {
            bookmarkHeading(headingId);
          }
        }
      }}
    >
      <span className="text-xl" aria-hidden>
        {lastHeadingId ? '★' : '☆'}
      </span>
      {label}
    </button>
  );
}
