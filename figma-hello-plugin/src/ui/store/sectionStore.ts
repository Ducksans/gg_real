import { signal, type Signal } from '@preact/signals';
import type { SectionInfo } from '../services/schema-builder';

export interface SectionState {
  readonly availableSections: SectionInfo[];
  readonly selectedSectionIds: string[];
}

export interface SectionStore {
  readonly state: Signal<SectionState>;
  setAvailableSections: (sections: SectionInfo[]) => void;
  selectSections: (sectionIds: string[]) => void;
  toggleSelection: (sectionId: string) => void;
  clearSelection: () => void;
  takeSnapshot: () => SectionSelectionSnapshot;
  restoreSnapshot: (snapshot: SectionSelectionSnapshot) => void;
}

export interface SectionSelectionSnapshot {
  readonly sectionIds: ReadonlyArray<string>;
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
      const uniqueSections = sections.filter(
        (section, index, arr) => arr.findIndex((item) => item.id === section.id) === index,
      );
      const currentSelection = state.value.selectedSectionIds.filter((id) =>
        uniqueSections.some((section) => section.id === id),
      );
      state.value = {
        availableSections: uniqueSections,
        selectedSectionIds:
          uniqueSections.length === 0
            ? []
            : currentSelection.length
              ? currentSelection
              : uniqueSections.map((section) => section.id),
      };
    },
    selectSections(sectionIds) {
      const { availableSections } = state.value;
      const validIds = sectionIds.filter((id) =>
        availableSections.some((section) => section.id === id),
      );
      state.value = {
        availableSections,
        selectedSectionIds: validIds,
      };
    },
    toggleSelection(sectionId) {
      const { selectedSectionIds, availableSections } = state.value;
      if (!availableSections.some((section) => section.id === sectionId)) {
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
    takeSnapshot() {
      return {
        sectionIds: [...state.value.selectedSectionIds],
      } satisfies SectionSelectionSnapshot;
    },
    restoreSnapshot(snapshot) {
      const { availableSections } = state.value;
      const validIds = snapshot.sectionIds.filter((id) =>
        availableSections.some((section) => section.id === id),
      );
      state.value = {
        availableSections,
        selectedSectionIds: [...validIds],
      };
    },
  };
};
