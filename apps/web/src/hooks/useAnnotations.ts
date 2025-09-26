import { useCallback, useEffect, useMemo, useState } from 'react';

export type Annotation = {
  id: string;
  doc: string;
  color: string;
  quote: string;
  prefix: string;
  suffix: string;
  position: { start: number; end: number };
  note?: string;
  tags?: string[];
  createdAt: string;
};

export type AnnotationsState = {
  annotations: Annotation[];
  addFromSelection: (color: string, note?: string) => void;
  updateAnnotation: (
    id: string,
    patch: Partial<Pick<Annotation, 'note' | 'color' | 'tags'>>,
  ) => void;
  removeAnnotation: (id: string) => void;
  clearAnnotations: () => void;
};

const STORAGE_PREFIX = 'wiki:annotations:';

function serializeSelection(docId: string, root?: HTMLElement | null) {
  if (typeof window === 'undefined') {
    return null;
  }
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }
  const range = selection.getRangeAt(0);
  if (range.collapsed) {
    return null;
  }
  const quote = selection.toString();
  if (!quote.trim()) {
    return null;
  }
  const referenceRoot = root ?? range.commonAncestorContainer?.ownerDocument?.body ?? undefined;
  if (!referenceRoot) {
    return null;
  }
  const temp = range.cloneRange();
  const rootRange = range.cloneRange();
  try {
    temp.selectNodeContents(referenceRoot);
  } catch (error) {
    console.warn('useAnnotations: unable to select node contents', error);
    return null;
  }
  rootRange.selectNodeContents(referenceRoot);
  temp.setEnd(range.startContainer, range.startOffset);
  const start = temp.toString().length;
  const end = start + quote.length;
  const fullText = referenceRoot.textContent ?? '';
  const prefix = fullText.slice(Math.max(0, start - 80), start);
  const suffix = fullText.slice(end, Math.min(fullText.length, end + 80));
  return { quote, prefix, suffix, position: { start, end }, range };
}

export function useAnnotations(
  docId: string,
  getRootElement?: () => HTMLElement | null,
): AnnotationsState {
  const storageKey = useMemo(() => `${STORAGE_PREFIX}${docId}`, [docId]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !docId) {
      return;
    }
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Annotation[];
        setAnnotations(parsed);
      }
    } catch (error) {
      console.warn('useAnnotations: failed to parse stored data', error);
    }
  }, [docId, storageKey]);

  const persist = useCallback(
    (next: Annotation[]) => {
      setAnnotations(next);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      }
    },
    [storageKey],
  );

  const addFromSelection = useCallback(
    (color: string, note?: string) => {
      if (!docId) {
        return;
      }
      const root = getRootElement?.() ?? null;
      const selectionData = serializeSelection(docId, root);
      if (!selectionData) {
        return;
      }
      const { quote, prefix, suffix, position } = selectionData;
      const annotation: Annotation = {
        id: `ann-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        doc: docId,
        color,
        quote,
        prefix,
        suffix,
        position,
        note,
        createdAt: new Date().toISOString(),
      };
      persist([...annotations, annotation]);
    },
    [annotations, docId, getRootElement, persist],
  );

  const updateAnnotation = useCallback(
    (id: string, patch: Partial<Pick<Annotation, 'note' | 'color' | 'tags'>>) => {
      persist(
        annotations.map((ann) =>
          ann.id === id
            ? {
                ...ann,
                ...patch,
                tags: patch.tags ?? ann.tags,
              }
            : ann,
        ),
      );
    },
    [annotations, persist],
  );

  const removeAnnotation = useCallback(
    (id: string) => {
      persist(annotations.filter((ann) => ann.id !== id));
    },
    [annotations, persist],
  );

  const clearAnnotations = useCallback(() => {
    persist([]);
  }, [persist]);

  return {
    annotations,
    addFromSelection,
    updateAnnotation,
    removeAnnotation,
    clearAnnotations,
  };
}
