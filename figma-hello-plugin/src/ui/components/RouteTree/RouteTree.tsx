// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import type { RouteStore } from '../../store';
import { RouteNode } from './RouteNode';

interface RouteTreeProps {
  readonly routeStore: RouteStore;
}

export const RouteTree = ({ routeStore }: RouteTreeProps) => {
  const { surfaces, selectedSurfaceId, selectedSlotId } = routeStore.state.value;

  if (!surfaces.length) {
    return (
      <div class="route-tree route-tree--empty">
        <p>등록된 Surface 정보가 없습니다.</p>
      </div>
    );
  }

  return (
    <div class="route-tree">
      <header class="route-tree__header">
        <h3>Surface · Slot</h3>
        <p>{surfaces.length} surfaces</p>
      </header>
      <ul class="route-tree__list">
        {surfaces.map((surface) => (
          <RouteNode
            key={surface.id}
            surface={surface}
            active={surface.id === selectedSurfaceId}
            selectedSlotId={surface.id === selectedSurfaceId ? selectedSlotId : undefined}
            onSelectSurface={() => routeStore.selectSurface(surface.id)}
            onSelectSlot={(slotId: string) => routeStore.selectSlot(surface.id, slotId)}
          />
        ))}
      </ul>
    </div>
  );
};
