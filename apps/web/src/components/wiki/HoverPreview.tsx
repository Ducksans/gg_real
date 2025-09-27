'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HoverPreviewState } from '@/hooks/useHoverPreview';

export type HoverPreviewProps<T> = {
  preview: HoverPreviewState<T> | null;
  onClose: () => void;
  renderContent: (data: T | null, loading: boolean, error: Error | null) => React.ReactNode;
};

type Position = { top: number; left: number };

export function HoverPreview<T>({ preview, onClose, renderContent }: HoverPreviewProps<T>) {
  const [position, setPosition] = useState<Position | null>(null);

  useEffect(() => {
    if (!preview || !preview.anchorRect || typeof window === 'undefined') {
      setPosition(null);
      return;
    }
    const { anchorRect } = preview;
    setPosition({
      top: anchorRect.bottom + window.scrollY + 8,
      left: anchorRect.left + window.scrollX,
    });
  }, [preview]);

  if (!preview || !preview.anchorRect || !position) {
    return null;
  }

  const content = (
    <div
      className="pointer-events-auto fixed z-40 w-80 max-w-[90vw] rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      style={position}
      onMouseLeave={onClose}
    >
      {renderContent(preview.data, preview.loading, preview.error)}
    </div>
  );

  if (typeof document === 'undefined') {
    return content;
  }

  return createPortal(content, document.body);
}
