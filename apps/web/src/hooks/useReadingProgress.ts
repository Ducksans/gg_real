import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type ReadingProgressOptions = {
  headingsSelector?: string;
  storageKeyPrefix?: string;
  autoScroll?: boolean;
};

export type ReadingProgressState = {
  lastHeadingId: string | null;
  bookmarkHeading: (headingId: string) => void;
  clearBookmark: () => void;
};

const DEFAULT_OPTIONS: Required<
  Pick<ReadingProgressOptions, 'headingsSelector' | 'storageKeyPrefix' | 'autoScroll'>
> = {
  headingsSelector: 'h2, h3, h4',
  storageKeyPrefix: 'wiki:readpos:',
  autoScroll: true,
};

export function useReadingProgress(
  docId: string,
  options?: ReadingProgressOptions,
): ReadingProgressState {
  const opts = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);
  const [lastHeadingId, setLastHeadingId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !docId) {
      return undefined;
    }
    const storageKey = `${opts.storageKeyPrefix}${docId}`;
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      setLastHeadingId(stored);
      if (opts.autoScroll) {
        window.requestAnimationFrame(() => {
          const el = document.getElementById(stored);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      }
    }

    const headings = Array.from(document.querySelectorAll<HTMLElement>(opts.headingsSelector));
    if (!headings.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          const headingId = visible[0].target.id;
          if (headingId) {
            setLastHeadingId((prev) => {
              if (prev !== headingId) {
                window.localStorage.setItem(storageKey, headingId);
              }
              return headingId;
            });
          }
        }
      },
      {
        rootMargin: '-30% 0px -60% 0px',
        threshold: [0, 1],
      },
    );

    headings.forEach((heading) => {
      if (!heading.id) {
        heading.id = heading.textContent
          ? heading.textContent.trim().toLowerCase().replace(/\s+/g, '-')
          : '';
      }
      observer.observe(heading);
    });
    observerRef.current = observer;

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [docId, opts.autoScroll, opts.headingsSelector, opts.storageKeyPrefix]);

  const bookmarkHeading = useCallback(
    (headingId: string) => {
      if (typeof window === 'undefined' || !docId || !headingId) {
        return;
      }
      const storageKey = `${opts.storageKeyPrefix}${docId}`;
      window.localStorage.setItem(storageKey, headingId);
      setLastHeadingId(headingId);
    },
    [docId, opts.storageKeyPrefix],
  );

  const clearBookmark = useCallback(() => {
    if (typeof window === 'undefined' || !docId) {
      return;
    }
    const storageKey = `${opts.storageKeyPrefix}${docId}`;
    window.localStorage.removeItem(storageKey);
    setLastHeadingId(null);
  }, [docId, opts.storageKeyPrefix]);

  return { lastHeadingId, bookmarkHeading, clearBookmark };
}
