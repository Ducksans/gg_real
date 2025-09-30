import {
  archetypeManifest,
  type ArchetypeSurface,
  type ArchetypeSurfaceSlot,
  type ArchetypeSlotSummary,
  type ArchetypeRoute,
  type BoxSpacing,
} from '../../lib/archetype-manifest';

import type { SurfaceConfig, SurfaceRouteSummary, SurfaceSlotConfig } from './types';

const normalizePadding = (padding?: BoxSpacing | null): BoxSpacing => {
  const { top = 0, right = 0, bottom = 0, left = 0 } = padding ?? {};
  return { top, right, bottom, left };
};

const normalizeSlot = (slotId: string, slot: ArchetypeSurfaceSlot): SurfaceSlotConfig => ({
  id: slotId.toLowerCase(),
  label: slot.label ?? slotId,
  parent: slot.parent ? slot.parent.toLowerCase() : null,
  layout: slot.layout,
  spacing: typeof slot.spacing === 'number' ? slot.spacing : undefined,
  padding: normalizePadding(slot.padding),
  width: slot.width,
  height: slot.height,
  grow: typeof slot.grow === 'number' ? slot.grow : undefined,
  allowedSections: Array.isArray(slot.allowedSections)
    ? Array.from(new Set(slot.allowedSections.map((entry) => entry.toString())))
    : [],
});

const normalizeRouteSummary = (summary: ArchetypeRoute): SurfaceRouteSummary => {
  const slots: Record<string, SurfaceRouteSummary['slots'][string]> = {};
  Object.entries(summary.slots ?? {}).forEach(([slotId, slotSummary]) => {
    const sections = slotSummary.sections.map((section) => ({
      id: section.id,
      sectionId: section.sectionId,
      order: section.order,
      label: section.label,
      description: section.description,
      raw: section.raw,
      slot: section.slot,
      slotLabel: section.slotLabel,
    }));

    slots[slotId.toLowerCase()] = {
      label: slotSummary.label,
      sections,
    };
  });

  return {
    label: summary.label,
    slots,
  };
};

const convertSurface = (surfaceId: string, surface: ArchetypeSurface): SurfaceConfig => {
  const slots: Record<string, SurfaceSlotConfig> = {};
  Object.entries(surface.slots ?? {}).forEach(([slotId, slot]) => {
    const normalized = normalizeSlot(slotId, slot as ArchetypeSurfaceSlot);
    slots[normalized.id] = normalized;
  });

  const routes: Record<string, SurfaceRouteSummary> = {};
  Object.entries(surface.routes ?? {}).forEach(([routeId, routeSummary]) => {
    routes[routeId] = normalizeRouteSummary(routeSummary as ArchetypeRoute);
  });

  return {
    id: surfaceId.toLowerCase(),
    label: surface.label,
    width: surface.layout.width,
    height: surface.layout.height ?? null,
    padding: normalizePadding(surface.layout.padding),
    spacing: surface.layout.spacing ?? 0,
    background: surface.layout.background ?? null,
    slots,
    routes,
    requiredSlots: Array.isArray(surface.requiredSlots)
      ? surface.requiredSlots.map((slot) => slot.toLowerCase())
      : [],
  } satisfies SurfaceConfig;
};

export const normalizeSurfaceManifest = (): SurfaceConfig[] =>
  Object.entries(archetypeManifest.surfaces).map(([surfaceId, surface]) =>
    convertSurface(surfaceId, surface as ArchetypeSurface),
  );
