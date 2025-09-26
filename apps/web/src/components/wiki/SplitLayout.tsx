import { PropsWithChildren, useCallback, useMemo, useRef, useState } from 'react';

export type SplitLayoutProps = PropsWithChildren<{
  enabled: boolean;
  onToggle: () => void;
  sideContent?: React.ReactNode;
  minSideWidth?: number;
  maxSideWidth?: number;
  initialSideWidth?: number;
}>;

const DEFAULT_SIDE = 360;
const MIN_SIDE = 240;
const MAX_SIDE = 720;

export function SplitLayout({
  enabled,
  onToggle,
  sideContent,
  minSideWidth = MIN_SIDE,
  maxSideWidth = MAX_SIDE,
  initialSideWidth = DEFAULT_SIDE,
  children,
}: SplitLayoutProps) {
  const [sideWidth, setSideWidth] = useState(initialSideWidth);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(sideWidth);

  const sideStyle = useMemo(() => ({ width: `${sideWidth}px` }), [sideWidth]);
  const statusText = enabled
    ? '분할 보기: 본문과 학습 도구를 나란히 보고 가운데 선을 드래그해 폭을 조절할 수 있습니다.'
    : '단일 보기: 본문을 넓게 보면서 필요할 때만 우측 학습 도구를 펼칩니다.';
  const toggleLabel = enabled ? '단일 보기로 전환' : '분할 보기로 전환';

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      draggingRef.current = true;
      startXRef.current = event.clientX;
      startWidthRef.current = sideWidth;
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
    },
    [sideWidth],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      const delta = startXRef.current - event.clientX;
      const next = Math.min(Math.max(startWidthRef.current + delta, minSideWidth), maxSideWidth);
      setSideWidth(next);
    },
    [maxSideWidth, minSideWidth],
  );

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <span>{statusText}</span>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-full border border-slate-300 px-3 py-1 font-medium text-slate-600 hover:bg-slate-100"
        >
          {toggleLabel}
        </button>
      </div>
      {enabled ? (
        <div className="grid grid-cols-[minmax(0,1fr)_8px_auto] gap-0 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="min-h-[60vh] overflow-auto p-6">{children}</div>
          <div
            role="separator"
            tabIndex={0}
            aria-label="분할 크기 조절"
            className="cursor-col-resize bg-slate-100 hover:bg-slate-200"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          <aside className="border-l border-slate-200" style={sideStyle}>
            <div className="h-full overflow-auto p-6">{sideContent}</div>
          </aside>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">{children}</div>
      )}
    </div>
  );
}
