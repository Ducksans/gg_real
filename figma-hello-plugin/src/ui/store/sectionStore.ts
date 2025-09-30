// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { signal, type Signal } from '@preact/signals';

export interface SectionState {
  readonly availableSections: string[];
  readonly selectedSectionIds: string[];
}

export interface SectionStore {
  readonly state: Signal<SectionState>;
  setAvailableSections: (sections: string[]) => void;
  toggleSelection: (sectionId: string) => void;
  clearSelection: () => void;
}

const createInitialState = (): SectionState => ({
  availableSections: [],
  selectedSectionIds: [],
});

export const createSectionStore = (): SectionStore => {
  const state = signal<SectionState>(createInitialState());

  return {
    state,
    setAvailableSections(sections) {
      const uniqueSections = Array.from(new Set(sections));
      const currentSelection = state.value.selectedSectionIds.filter((id) =>
        uniqueSections.includes(id),
      );
      state.value = {
        availableSections: uniqueSections,
        selectedSectionIds:
          uniqueSections.length === 0
            ? []
            : currentSelection.length
              ? currentSelection
              : uniqueSections,
      };
    },
    toggleSelection(sectionId) {
      const { selectedSectionIds, availableSections } = state.value;
      if (!availableSections.includes(sectionId)) {
        return;
      }
      const isSelected = selectedSectionIds.includes(sectionId);
      state.value = {
        availableSections,
        selectedSectionIds: isSelected
          ? selectedSectionIds.filter((id) => id !== sectionId)
          : [...selectedSectionIds, sectionId],
      };
    },
    clearSelection() {
      state.value = {
        availableSections: state.value.availableSections,
        selectedSectionIds: [],
      };
    },
  };
};
