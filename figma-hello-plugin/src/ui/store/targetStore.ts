// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { signal, type Signal } from '@preact/signals';

export type TargetMode = 'append' | 'replace' | 'update';

export interface TargetState {
  readonly pages: string[];
  readonly currentPage?: string;
  readonly selectedPage?: string;
  readonly frameName: string;
  readonly mode: TargetMode;
}

export interface TargetStore {
  readonly state: Signal<TargetState>;
  setPages: (pages: string[], currentPage?: string) => void;
  selectPage: (page?: string) => void;
  selectMode: (mode: TargetMode) => void;
  setFrameName: (frameName: string) => void;
  reset: () => void;
}

const createInitialState = (): TargetState => ({
  pages: [],
  frameName: 'GeneratedFrame',
  mode: 'append',
});

const dedupePages = (pages: string[]): string[] => {
  const seen = new Set<string>();
  const results: string[] = [];
  pages.forEach((page) => {
    const trimmed = page.trim();
    if (!trimmed.length || seen.has(trimmed)) return;
    seen.add(trimmed);
    results.push(trimmed);
  });
  return results;
};

export const createTargetStore = (): TargetStore => {
  const state = signal<TargetState>(createInitialState());

  const setPages = (pages: string[], currentPage?: string) => {
    const uniquePages = dedupePages(pages);
    const selectedPage = state.value.selectedPage;
    const fallbackPage = uniquePages.includes(selectedPage ?? '') ? selectedPage : undefined;
    state.value = {
      pages: uniquePages,
      currentPage: currentPage?.trim() || state.value.currentPage,
      selectedPage: fallbackPage,
      frameName: state.value.frameName,
      mode: state.value.mode,
    };
  };

  const selectPage = (page?: string) => {
    const trimmed = page?.trim();
    if (trimmed && !state.value.pages.includes(trimmed)) {
      return;
    }
    state.value = {
      ...state.value,
      selectedPage: trimmed || undefined,
    };
  };

  const selectMode = (mode: TargetMode) => {
    state.value = {
      ...state.value,
      mode,
    };
  };

  const setFrameName = (frameName: string) => {
    state.value = {
      ...state.value,
      frameName: frameName.trim(),
    };
  };

  const reset = () => {
    state.value = createInitialState();
  };

  return {
    state,
    setPages,
    selectPage,
    selectMode,
    setFrameName,
    reset,
  };
};
