// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import type { SectionStore } from '../../store';

interface TargetSelectProps {
  sectionStore: SectionStore;
}

export const TargetSelect = ({ sectionStore }: TargetSelectProps) => {
  const { availableSections, selectedSectionIds } = sectionStore.state.value;

  if (!availableSections.length) {
    return <p class="target-select__empty">선택 가능한 섹션이 없습니다.</p>;
  }

  return (
    <div class="target-select">
      <h3 class="target-select__title">실행 대상 섹션</h3>
      <ul class="target-select__list">
        {availableSections.map((sectionId) => {
          const safeId = sectionId.replace(/[^a-zA-Z0-9_-]/g, '-');
          const checkboxId = `section-${safeId}`;
          const isChecked = selectedSectionIds.includes(sectionId);
          return (
            <li key={sectionId} class="target-select__item">
              <label for={checkboxId}>
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => sectionStore.toggleSelection(sectionId)}
                />
                <span>{sectionId}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <button
        class="target-select__clear"
        onClick={() => sectionStore.clearSelection()}
        type="button"
      >
        선택 초기화
      </button>
    </div>
  );
};
