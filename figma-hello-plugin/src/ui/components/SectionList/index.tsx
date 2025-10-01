import { useMemo } from 'preact/hooks';
import { useSignal } from '@preact/signals';
import type { SectionStore } from '../../store/sectionStore';
import { SectionFilter } from './SectionFilter';
import { SectionItem } from './SectionItem';

import './section-list.css';

interface SectionListProps {
  sectionStore: SectionStore;
}

export const SectionList = ({ sectionStore }: SectionListProps) => {
  const { availableSections, selectedSectionIds } = sectionStore.state.value;
  const querySignal = useSignal('');

  const handleFilterChange = (value: string) => {
    querySignal.value = value.trim().toLowerCase();
  };

  const filteredSections = useMemo(() => {
    const query = querySignal.value;
    if (!query) {
      return availableSections;
    }
    return availableSections.filter((section) => {
      return (
        section.label.toLowerCase().includes(query) ||
        (section.description?.toLowerCase().includes(query) ?? false) ||
        (section.slotLabel?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [availableSections, querySignal.value]);

  return (
    <div class="section-list">
      <header class="section-list__header">
        <div>
          <h3>Sections</h3>
          <p class="section-list__summary">
            {selectedSectionIds.length} 선택 / {availableSections.length} 전체
          </p>
        </div>
        <button
          type="button"
          class="section-list__clear"
          onClick={() => sectionStore.clearSelection()}
          disabled={selectedSectionIds.length === 0}
        >
          선택 해제
        </button>
      </header>
      <SectionFilter onFilterChange={handleFilterChange} />
      <ul class="section-list__items">
        {filteredSections.map((section) => (
          <SectionItem
            key={section.id}
            section={section}
            selected={selectedSectionIds.includes(section.id)}
            onToggle={sectionStore.toggleSelection}
          />
        ))}
      </ul>
    </div>
  );
};
