import { useCallback, useEffect, useState } from 'react';

export type SelectionQuickMenuState = {
  isOpen: boolean;
  position: { top: number; left: number } | null;
  selectedText: string;
  range: Range | null;
};

const INITIAL_STATE: SelectionQuickMenuState = {
  isOpen: false,
  position: null,
  selectedText: '',
  range: null,
};

export function useSelectionQuickMenu() {
  const [state, setState] = useState<SelectionQuickMenuState>(INITIAL_STATE);

  const close = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const handleSelectionChange = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      close();
      return;
    }
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    if (!selectedText || range.collapsed) {
      close();
      return;
    }
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.top === 0 && rect.bottom === 0)) {
      close();
      return;
    }
    const position = {
      top: rect.top + window.scrollY - 8,
      left: rect.left + window.scrollX + rect.width / 2,
    };
    setState({
      isOpen: true,
      position,
      selectedText,
      range,
    });
  }, [close]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }
    const onMouseUp = () => window.setTimeout(handleSelectionChange, 0);
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      } else {
        window.setTimeout(handleSelectionChange, 0);
      }
    };
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [close, handleSelectionChange]);

  return {
    state,
    close,
  };
}
