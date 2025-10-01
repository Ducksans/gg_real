import { SlotSummary } from './SlotSummary';
import type { RouteSlotInfo, SectionInfo } from '../../services/schema-builder';

interface SlotNodeProps {
  readonly slot: RouteSlotInfo;
  readonly visibleSections: SectionInfo[];
  readonly filterActive: boolean;
  readonly active: boolean;
  readonly isExpanded: boolean;
  readonly selectedSectionIds: string[];
  readonly onSelect: () => void;
  readonly onToggleExpand: () => void;
  readonly onToggleSlot: (selectAll: boolean) => void;
  readonly onToggleSection: (sectionId: string) => void;
}

export const SlotNode = ({
  slot,
  visibleSections,
  filterActive,
  active,
  isExpanded,
  selectedSectionIds,
  onSelect,
  onToggleExpand,
  onToggleSlot,
  onToggleSection,
}: SlotNodeProps) => {
  const totalCount = slot.sections.length;
  const visibleCount = filterActive ? visibleSections.length : totalCount;
  const selectedCount = slot.sections.filter((section) =>
    selectedSectionIds.includes(section.id),
  ).length;
  const visibleSelectedCount = visibleSections.filter((section) =>
    selectedSectionIds.includes(section.id),
  ).length;
  const isChecked = totalCount > 0 && selectedCount === totalCount;
  const toggleLabel = isExpanded ? '▾' : '▸';

  const handleSlotCheckboxChange = (event: Event) => {
    event.stopPropagation();
    const target = event.currentTarget as HTMLInputElement;
    if (!active) {
      onSelect();
      return;
    }
    onToggleSlot(target.checked);
  };

  const summarySelected = filterActive ? visibleSelectedCount : selectedCount;
  const summaryTotal = filterActive ? visibleCount : totalCount;

  return (
    <li class={`route-slot ${active ? 'route-slot--active' : ''}`}>
      <div class="route-slot__header">
        <button
          type="button"
          class="route-slot__toggle"
          aria-label={isExpanded ? '슬롯 접기' : '슬롯 펼치기'}
          onClick={(event) => {
            event.stopPropagation();
            onToggleExpand();
          }}
        >
          {toggleLabel}
        </button>
        <label class="route-slot__checkbox">
          <input
            type="checkbox"
            checked={isChecked}
            aria-checked={
              totalCount > 0 && selectedCount > 0 && selectedCount < totalCount
                ? 'mixed'
                : isChecked
            }
            onClick={(event) => event.stopPropagation()}
            onChange={handleSlotCheckboxChange}
          />
        </label>
        <button type="button" onClick={onSelect} class="route-slot__button">
          <span>{slot.label}</span>
          <SlotSummary selectedCount={summarySelected} totalCount={summaryTotal} />
        </button>
      </div>
      {isExpanded && visibleCount ? (
        <ul class="route-slot__sections">
          {visibleSections.map((section) => {
            const checked = selectedSectionIds.includes(section.id);
            return (
              <li key={section.id} class="route-section">
                <label class="route-section__label">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      if (!active) {
                        onSelect();
                        return;
                      }
                      onToggleSection(section.id);
                    }}
                  />
                  <div class="route-section__content">
                    <span class="route-section__name">{section.label}</span>
                    {section.description ? (
                      <span class="route-section__meta">{section.description}</span>
                    ) : null}
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
};
