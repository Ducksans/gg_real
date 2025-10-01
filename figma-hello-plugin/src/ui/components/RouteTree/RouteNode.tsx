import type { RouteInfo, RouteSlotInfo, SectionInfo } from '../../services/schema-builder';
import { SlotNode } from './SlotNode';

interface VisibleSlot {
  readonly slot: RouteSlotInfo;
  readonly visibleSections: SectionInfo[];
}

interface RouteNodeProps {
  readonly surfaceId: string;
  readonly route: RouteInfo;
  readonly slots: VisibleSlot[];
  readonly isActive: boolean;
  readonly isExpanded: boolean;
  readonly filterActive: boolean;
  readonly selectedSlotId?: string;
  readonly selectedSectionIds: string[];
  readonly onSelectRoute: () => void;
  readonly onToggleExpand: () => void;
  readonly onToggleRouteSections: (selectAll: boolean, sections: SectionInfo[]) => void;
  readonly onSelectSlot: (slotId: string) => void;
  readonly onToggleSlot: (
    slot: RouteSlotInfo,
    visibleSections: SectionInfo[],
    selectAll: boolean,
  ) => void;
  readonly onToggleSection: (sectionId: string) => void;
  readonly isSlotExpanded: (slotId: string) => boolean;
  readonly onToggleSlotExpand: (slotId: string) => void;
}

export const RouteNode = ({
  surfaceId,
  route,
  slots,
  isActive,
  isExpanded,
  filterActive,
  selectedSlotId,
  selectedSectionIds,
  onSelectRoute,
  onToggleExpand,
  onToggleRouteSections,
  onSelectSlot,
  onToggleSlot,
  onToggleSection,
  isSlotExpanded,
  onToggleSlotExpand,
}: RouteNodeProps) => {
  const allSections = route.slots.reduce<SectionInfo[]>((accumulator, slot) => {
    slot.sections.forEach((section) => accumulator.push(section));
    return accumulator;
  }, []);
  const visibleSections = filterActive
    ? slots.reduce<SectionInfo[]>((accumulator, entry) => {
        entry.visibleSections.forEach((section) => accumulator.push(section));
        return accumulator;
      }, [])
    : allSections;

  const selectedCount = allSections.filter((section) =>
    selectedSectionIds.includes(section.id),
  ).length;
  const visibleSelectedCount = visibleSections.filter((section) =>
    selectedSectionIds.includes(section.id),
  ).length;
  const totalCount = allSections.length;
  const toggleLabel = isExpanded ? '▾' : '▸';
  const fullyChecked = totalCount > 0 && selectedCount === totalCount;
  const indeterminate = totalCount > 0 && selectedCount > 0 && selectedCount < totalCount;

  const handleRouteCheckboxChange = (event: Event) => {
    event.stopPropagation();
    const target = event.currentTarget as HTMLInputElement;
    onToggleRouteSections(target.checked, visibleSections.length ? visibleSections : allSections);
  };

  return (
    <li class={`route-node ${isActive ? 'route-node--active' : ''}`}>
      <div class="route-node__header">
        <button
          type="button"
          class="route-node__toggle"
          aria-label={isExpanded ? '라우트 접기' : '라우트 펼치기'}
          onClick={(event) => {
            event.stopPropagation();
            onToggleExpand();
          }}
        >
          {toggleLabel}
        </button>
        <label class="route-node__checkbox">
          <input
            type="checkbox"
            checked={fullyChecked}
            aria-checked={indeterminate ? 'mixed' : fullyChecked}
            onClick={(event) => event.stopPropagation()}
            onChange={handleRouteCheckboxChange}
          />
        </label>
        <button type="button" class="route-node__route" onClick={onSelectRoute}>
          <span>{route.label}</span>
          <span class="route-node__count">
            {filterActive
              ? `${visibleSelectedCount}/${visibleSections.length || 0}`
              : `${selectedCount}/${totalCount}`}
          </span>
        </button>
      </div>
      {isExpanded ? (
        <ul class="route-node__slots">
          {slots.map(({ slot, visibleSections }) => (
            <SlotNode
              key={`${surfaceId}-${route.id}-${slot.id}`}
              slot={slot}
              visibleSections={visibleSections}
              filterActive={filterActive}
              active={selectedSlotId === slot.id}
              isExpanded={isSlotExpanded(slot.id)}
              selectedSectionIds={selectedSectionIds}
              onSelect={() => onSelectSlot(slot.id)}
              onToggleExpand={() => onToggleSlotExpand(slot.id)}
              onToggleSlot={(selectAll) => onToggleSlot(slot, visibleSections, selectAll)}
              onToggleSection={onToggleSection}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
};
