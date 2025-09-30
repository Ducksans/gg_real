// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { signal, type Signal } from '@preact/signals';

export interface PreviewState {
  readonly frameName?: string;
  readonly previousFrameName?: string;
  readonly page?: string;
  readonly sections: string[];
  readonly lastIntent?: 'dry-run' | 'apply';
  readonly slotId?: string;
  readonly createdCount: number;
  readonly createdNodeNames: string[];
}

export interface PreviewStore {
  readonly state: Signal<PreviewState>;
  setPreview: (snapshot: Partial<PreviewState>) => void;
  reset: () => void;
}

const createInitialState = (): PreviewState => ({
  sections: [],
  createdCount: 0,
  createdNodeNames: [],
});

export const createPreviewStore = (): PreviewStore => {
  const state = signal<PreviewState>(createInitialState());

  return {
    state,
    setPreview(snapshot) {
      const current = state.value;
      const hasNewFrame = typeof snapshot.frameName === 'string' && snapshot.frameName.length > 0;
      state.value = {
        previousFrameName: hasNewFrame ? current.frameName : current.previousFrameName,
        frameName: snapshot.frameName ?? current.frameName,
        page: snapshot.page ?? current.page,
        sections: snapshot.sections ? [...snapshot.sections] : [...(current.sections ?? [])],
        lastIntent: snapshot.lastIntent ?? current.lastIntent,
        slotId: snapshot.slotId ?? current.slotId,
        createdCount: snapshot.createdCount ?? current.createdCount ?? 0,
        createdNodeNames: snapshot.createdNodeNames
          ? [...snapshot.createdNodeNames]
          : [...(current.createdNodeNames ?? [])],
      };
    },
    reset() {
      state.value = createInitialState();
    },
  };
};
