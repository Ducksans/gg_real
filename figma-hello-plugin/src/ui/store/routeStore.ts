// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { signal, type Signal } from '@preact/signals';
import { getSurfaces, type SurfaceInfo } from '../services/schema-builder';

export interface RouteState {
  readonly surfaces: SurfaceInfo[];
  readonly selectedSurfaceId?: string;
  readonly selectedSlotId?: string;
}

export interface RouteStore {
  readonly state: Signal<RouteState>;
  load: () => void;
  selectSurface: (surfaceId: string) => void;
  selectSlot: (surfaceId: string, slotId: string) => void;
}

const selectInitialSlot = (surface: SurfaceInfo | undefined): string | undefined =>
  surface?.slots[0]?.id;

export const createRouteStore = (): RouteStore => {
  const state = signal<RouteState>({ surfaces: [] });

  const load = () => {
    const surfaces = getSurfaces();
    let selectedSurfaceId = state.value.selectedSurfaceId;
    let selectedSlotId = state.value.selectedSlotId;

    if (!selectedSurfaceId && surfaces.length) {
      selectedSurfaceId = surfaces[0].id;
      selectedSlotId = selectInitialSlot(surfaces[0]);
    }

    state.value = {
      surfaces,
      selectedSurfaceId,
      selectedSlotId,
    };
  };

  const selectSurface = (surfaceId: string) => {
    const surfaces = state.value.surfaces;
    const surface = surfaces.find((item) => item.id === surfaceId);
    if (!surface) return;
    state.value = {
      surfaces,
      selectedSurfaceId: surfaceId,
      selectedSlotId: selectInitialSlot(surface),
    };
  };

  const selectSlot = (surfaceId: string, slotId: string) => {
    const surfaces = state.value.surfaces;
    const surface = surfaces.find((item) => item.id === surfaceId);
    if (!surface) return;
    const slotExists = surface.slots.some((slot) => slot.id === slotId);
    if (!slotExists) return;
    state.value = {
      surfaces,
      selectedSurfaceId: surfaceId,
      selectedSlotId: slotId,
    };
  };

  return {
    state,
    load,
    selectSurface,
    selectSlot,
  };
};
