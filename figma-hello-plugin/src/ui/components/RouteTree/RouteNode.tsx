// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import type { SurfaceInfo } from '../../services/schema-builder';
import { SlotNode } from './SlotNode';

interface RouteNodeProps {
  readonly surface: SurfaceInfo;
  readonly active: boolean;
  readonly selectedSlotId?: string;
  readonly onSelectSurface: () => void;
  readonly onSelectSlot: (slotId: string) => void;
}

export const RouteNode = ({
  surface,
  active,
  selectedSlotId,
  onSelectSurface,
  onSelectSlot,
}: RouteNodeProps) => (
  <li class={`route-node ${active ? 'route-node--active' : ''}`}>
    <button type="button" class="route-node__surface" onClick={onSelectSurface}>
      {surface.label}
    </button>
    <ul class="route-node__slots">
      {surface.slots.map((slot) => (
        <SlotNode
          key={slot.id}
          slot={slot}
          active={active && selectedSlotId === slot.id}
          onSelect={() => onSelectSlot(slot.id)}
        />
      ))}
    </ul>
  </li>
);
