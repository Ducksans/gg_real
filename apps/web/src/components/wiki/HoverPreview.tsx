'use client';

import { HoverPreviewState } from '@/hooks/useHoverPreview';

export type HoverPreviewProps<T> = {
  preview: HoverPreviewState<T> | null;
  onClose: () => void;
  renderContent: (data: T | null, loading: boolean, error: Error | null) => React.ReactNode;
};

export function HoverPreview<T>({ preview, onClose, renderContent }: HoverPreviewProps<T>) {
  if (!preview || !preview.anchorRect) {
    return null;
  }

  const { anchorRect } = preview;
  const style = {
    top: anchorRect.bottom + window.scrollY + 8,
    left: anchorRect.left + window.scrollX,
  };

  return (
    <div
      className="absolute z-40 w-80 max-w-[90vw] rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-xl"
      style={style}
      onMouseLeave={onClose}
    >
      {renderContent(preview.data, preview.loading, preview.error)}
    </div>
  );
}
