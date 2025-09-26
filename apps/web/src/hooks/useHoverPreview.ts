import { useCallback, useEffect, useRef, useState } from 'react';

export type HoverPreviewOptions = {
  openDelay?: number;
  closeDelay?: number;
};

export type HoverPreviewState<T> = {
  refId: string;
  data: T | null;
  anchorRect: DOMRect | null;
  loading: boolean;
  error: Error | null;
};

const DEFAULT_OPTIONS: Required<HoverPreviewOptions> = {
  openDelay: 150,
  closeDelay: 120,
};

export function useHoverPreview<T>(
  resolver: (refId: string) => Promise<T | null>,
  options?: HoverPreviewOptions,
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [state, setState] = useState<HoverPreviewState<T> | null>(null);
  const openTimer = useRef<number>();
  const closeTimer = useRef<number>();
  const pendingRef = useRef<string | null>(null);

  const clearTimers = useCallback(() => {
    if (openTimer.current) {
      window.clearTimeout(openTimer.current);
      openTimer.current = undefined;
    }
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = undefined;
    }
  }, []);

  const close = useCallback(() => {
    clearTimers();
    closeTimer.current = window.setTimeout(() => {
      setState(null);
      pendingRef.current = null;
    }, opts.closeDelay);
  }, [clearTimers, opts.closeDelay]);

  const open = useCallback(
    (refId: string, anchorRect: DOMRect | null) => {
      clearTimers();
      pendingRef.current = refId;
      openTimer.current = window.setTimeout(async () => {
        setState({ refId, anchorRect, data: null, loading: true, error: null });
        try {
          const result = await resolver(refId);
          if (pendingRef.current === refId) {
            setState({ refId, anchorRect, data: result, loading: false, error: null });
          }
        } catch (error) {
          if (pendingRef.current === refId) {
            setState({ refId, anchorRect, data: null, loading: false, error: error as Error });
          }
        }
      }, opts.openDelay);
    },
    [clearTimers, opts.openDelay, resolver],
  );

  useEffect(() => () => clearTimers(), [clearTimers]);

  return {
    preview: state,
    isOpen: Boolean(state),
    open,
    close,
  };
}
