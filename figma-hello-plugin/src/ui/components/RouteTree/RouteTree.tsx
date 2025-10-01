import { useSignal } from '@preact/signals';
import { useMemo } from 'preact/hooks';

import type { RouteStore, SectionStore } from '../../store';
import type {
  RouteInfo,
  RouteSlotInfo,
  SectionInfo,
  SurfaceRouteTree,
} from '../../services/schema-builder';
import { RouteNode } from './RouteNode';

interface RouteTreeProps {
  readonly routeStore: RouteStore;
  readonly sectionStore: SectionStore;
}

interface VisibleSlot {
  readonly slot: RouteSlotInfo;
  readonly visibleSections: SectionInfo[];
}

interface VisibleRoute {
  readonly route: RouteInfo;
  readonly slots: VisibleSlot[];
}

export const RouteTree = ({ routeStore, sectionStore }: RouteTreeProps) => {
  const { surfaces, selectedSurfaceId, selectedRouteId, selectedSlotId } = routeStore.state.value;
  const { selectedSectionIds } = sectionStore.state.value;

  const query = useSignal('');

  if (!surfaces.length) {
    return (
      <div class="route-tree route-tree--empty">
        <p>등록된 Surface 정보가 없습니다.</p>
      </div>
    );
  }

  const activeSurface =
    surfaces.find((surface) => surface.id === selectedSurfaceId) ?? surfaces[0] ?? null;

  const filterText = query.value.trim().toLowerCase();
  const filterActive = filterText.length > 0;

  const filteredRoutes: VisibleRoute[] = useMemo(() => {
    if (!activeSurface) return [];
    return activeSurface.routes
      .map((route) => {
        const slots = route.slots
          .map((slot) => {
            const visibleSections = slot.sections.filter((section) => {
              if (!filterActive) return true;
              const label = section.label?.toLowerCase() ?? '';
              const description = section.description?.toLowerCase() ?? '';
              return label.includes(filterText) || description.includes(filterText);
            });
            return { slot, visibleSections } satisfies VisibleSlot;
          })
          .filter((entry) => entry.visibleSections.length > 0 || !filterActive);
        const hasVisible = slots.some((entry) => entry.visibleSections.length > 0);
        return { route, slots, hasVisible };
      })
      .filter((entry) => entry.hasVisible || !filterActive)
      .map(({ route, slots }) => ({ route, slots }));
  }, [activeSurface, filterActive, filterText]);

  const applySectionSelection = (sections: SectionInfo[], selectAll: boolean) => {
    const current = new Set(sectionStore.state.value.selectedSectionIds);
    sections.forEach((section) => {
      if (selectAll) {
        current.add(section.id);
      } else {
        current.delete(section.id);
      }
    });
    sectionStore.selectSections(Array.from(current.values()));
  };

  const selectAllRouteSections = (
    surfaceId: string,
    route: RouteInfo,
    sections: SectionInfo[],
    selectAll: boolean,
  ) => {
    const targetSections =
      selectAll && filterActive
        ? sections
        : route.slots.reduce<SectionInfo[]>((accumulator, slot) => {
            slot.sections.forEach((section) => accumulator.push(section));
            return accumulator;
          }, []);
    applySectionSelection(targetSections, selectAll);
    if (selectAll && !routeStore.isRouteExpanded(surfaceId, route.id)) {
      routeStore.toggleRouteExpanded(surfaceId, route.id);
    }
  };

  const selectAllSlotSections = (
    surfaceId: string,
    routeId: string,
    slot: RouteSlotInfo,
    visibleSections: SectionInfo[],
    selectAll: boolean,
  ) => {
    const sections = selectAll && filterActive ? visibleSections : slot.sections;
    applySectionSelection(sections, selectAll);
    if (selectAll && !routeStore.isSlotExpanded(surfaceId, routeId, slot.id)) {
      routeStore.toggleSlotExpanded(surfaceId, routeId, slot.id);
    }
  };

  return (
    <div class="route-tree">
      <header class="route-tree__header">
        <h3>Surface · Route · Slot</h3>
        <p>{surfaces.length} surfaces</p>
      </header>
      <div class="route-tree__search-bar">
        <input
          type="search"
          class="route-tree__search"
          placeholder="섹션 검색"
          value={query.value}
          onInput={(event) => {
            query.value = (event.currentTarget as HTMLInputElement).value;
          }}
        />
      </div>
      <div class="route-tree__surfaces">
        {surfaces.map((surface) => (
          <button
            key={surface.id}
            type="button"
            class={`route-tree__surface-tab ${
              surface.id === activeSurface?.id ? 'route-tree__surface-tab--active' : ''
            }`}
            onClick={() => routeStore.selectSurface(surface.id)}
          >
            {surface.label}
          </button>
        ))}
      </div>
      <div class="route-tree__body">
        {activeSurface && filteredRoutes.length ? (
          <ul class="route-tree__routes">
            {filteredRoutes.map(({ route, slots }) => (
              <RouteNode
                key={route.id}
                surfaceId={activeSurface.id}
                route={route}
                slots={slots}
                filterActive={filterActive}
                isActive={selectedRouteId === route.id}
                isExpanded={routeStore.isRouteExpanded(activeSurface.id, route.id)}
                selectedSlotId={selectedRouteId === route.id ? selectedSlotId : undefined}
                selectedSectionIds={selectedSectionIds}
                onSelectRoute={() => routeStore.selectRoute(activeSurface.id, route.id)}
                onToggleExpand={() => routeStore.toggleRouteExpanded(activeSurface.id, route.id)}
                onToggleRouteSections={(selectAll, sections) =>
                  selectAllRouteSections(activeSurface.id, route, sections, selectAll)
                }
                onSelectSlot={(slotId) => routeStore.selectSlot(activeSurface.id, route.id, slotId)}
                onToggleSlot={(slot, visibleSections, selectAll) =>
                  selectAllSlotSections(
                    activeSurface.id,
                    route.id,
                    slot,
                    visibleSections,
                    selectAll,
                  )
                }
                onToggleSection={(sectionId) => sectionStore.toggleSelection(sectionId)}
                isSlotExpanded={(slotId) =>
                  routeStore.isSlotExpanded(activeSurface.id, route.id, slotId)
                }
                onToggleSlotExpand={(slotId) =>
                  routeStore.toggleSlotExpanded(activeSurface.id, route.id, slotId)
                }
              />
            ))}
          </ul>
        ) : (
          <div class="route-tree__empty">
            <p>표시할 Route 정보가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};
