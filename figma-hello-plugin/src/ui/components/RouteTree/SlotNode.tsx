// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import type { SurfaceSlotInfo } from '../../services/schema-builder';
import { SlotSummary } from './SlotSummary';

interface SlotNodeProps {
  readonly slot: SurfaceSlotInfo;
  readonly active: boolean;
  readonly onSelect: () => void;
}

export const SlotNode = ({ slot, active, onSelect }: SlotNodeProps) => (
  <li class={`route-slot ${active ? 'route-slot--active' : ''}`}>
    <button type="button" onClick={onSelect} class="route-slot__button">
      <span>{slot.label}</span>
      <SlotSummary allowedCount={slot.allowedSectionIds.length} />
    </button>
  </li>
);
