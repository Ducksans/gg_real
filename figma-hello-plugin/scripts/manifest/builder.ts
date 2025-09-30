import { normalizePadding, titleCase } from './utils';
import { loadPageSections, loadSurfaceDefinitions } from './loader';
import type { RawSurfaceDefinition, SectionFile } from './types';

interface SlotSummary {
  label: string;
  sections: Array<{
    id: string;
    sectionId: string;
    order: number | null;
    label: string;
    description: string;
    raw: string;
    slot: string;
    slotLabel: string;
  }>;
}

interface SurfaceSlotEntry {
  id: string;
  label: string;
  parent: string | null;
  layout?: 'VERTICAL' | 'HORIZONTAL';
  spacing?: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  width?: number | 'hug' | 'fill';
  height?: number | 'hug';
  grow?: number;
  allowedSections: string[];
}

export interface ArchetypeManifest {
  generatedAt: string;
  surfaces: Record<
    string,
    RawSurfaceDefinition & {
      slots: Record<string, SurfaceSlotEntry>;
    }
  >;
  routes: Record<
    string,
    {
      label: string;
      slots: Record<string, SlotSummary>;
    }
  >;
  pages: Record<
    string,
    {
      label: string;
      sections: SectionFile[];
    }
  >;
}

const ensureSurface = (
  manifest: ArchetypeManifest,
  surfaceId: string,
  label: string,
): RawSurfaceDefinition & { slots: Record<string, SurfaceSlotEntry> } => {
  if (!manifest.surfaces[surfaceId]) {
    manifest.surfaces[surfaceId] = {
      id: surfaceId,
      label,
      layout: {
        width: 900,
        height: null,
        padding: normalizePadding(),
        spacing: 0,
        background: null,
      },
      slots: {},
      routes: {},
      requiredSlots: [],
    };
  }

  return manifest.surfaces[surfaceId];
};

const ensureSurfaceSlot = (
  surface: RawSurfaceDefinition & { slots: Record<string, SurfaceSlotEntry> },
  slotId: string,
  slotLabel: string,
): SurfaceSlotEntry => {
  if (!surface.slots[slotId]) {
    surface.slots[slotId] = {
      id: slotId,
      label: slotLabel,
      parent: null,
      layout: undefined,
      spacing: undefined,
      padding: normalizePadding(),
      width: undefined,
      height: undefined,
      grow: undefined,
      allowedSections: [],
    };
  }
  return surface.slots[slotId];
};

const ensureSurfaceRoute = (
  surface: RawSurfaceDefinition & { slots: Record<string, SurfaceSlotEntry> },
  routeId: string,
  routeLabel: string,
) => {
  if (!surface.routes) {
    surface.routes = {};
  }
  if (!surface.routes[routeId]) {
    surface.routes[routeId] = {
      label: routeLabel,
      slots: {},
    };
  }
  return surface.routes[routeId];
};

const ensureRouteSlot = (summary: SlotSummary | undefined, slotLabel: string): SlotSummary =>
  summary ?? {
    label: slotLabel,
    sections: [],
  };

const toSectionSummary = (section: SectionFile) => ({
  id: section.id,
  sectionId: section.sectionId,
  order: section.order,
  label: section.label,
  description: section.description,
  raw: section.raw,
  slot: section.slot,
  slotLabel: section.slotLabel,
});

export const buildManifest = (): ArchetypeManifest => {
  const surfaceDefinitions = loadSurfaceDefinitions();
  const pages = loadPageSections();

  const manifest: ArchetypeManifest = {
    generatedAt: new Date().toISOString(),
    surfaces: { ...surfaceDefinitions },
    routes: {},
    pages: {},
  };

  pages.forEach(({ page, sections }) => {
    manifest.pages[page] = {
      label: titleCase(page),
      sections: sections.map(
        ({ designSurface, designSurfaceLabel, route, routeLabel, slot, slotLabel, ...rest }) => ({
          ...rest,
          slot,
          slotLabel,
        }),
      ),
    };

    sections.forEach((section) => {
      const surfaceEntry = ensureSurface(
        manifest,
        section.designSurface,
        section.designSurfaceLabel,
      );
      const slotEntry = ensureSurfaceSlot(surfaceEntry, section.slot, section.slotLabel);
      if (!slotEntry.allowedSections.includes(section.sectionId)) {
        slotEntry.allowedSections.push(section.sectionId);
      }

      const surfaceRoute = ensureSurfaceRoute(surfaceEntry, section.route, section.routeLabel);
      if (!surfaceRoute.slots) {
        surfaceRoute.slots = {};
      }

      const surfaceRouteSlot = ensureRouteSlot(surfaceRoute.slots[section.slot], section.slotLabel);
      surfaceRouteSlot.sections.push(toSectionSummary(section));
      surfaceRoute.slots[section.slot] = surfaceRouteSlot;

      if (!manifest.routes[section.route]) {
        manifest.routes[section.route] = {
          label: section.routeLabel,
          slots: {},
        };
      }

      const globalRouteSlot = ensureRouteSlot(
        manifest.routes[section.route].slots[section.slot],
        section.slotLabel,
      );
      globalRouteSlot.sections.push(toSectionSummary(section));
      manifest.routes[section.route].slots[section.slot] = globalRouteSlot;
    });
  });

  Object.values(manifest.routes).forEach((route) => {
    Object.values(route.slots).forEach((slot) => {
      slot.sections.sort((a, b) => {
        if (a.order === null && b.order === null) return 0;
        if (a.order === null) return 1;
        if (b.order === null) return -1;
        return a.order - b.order;
      });
    });
  });

  Object.values(manifest.pages).forEach((page) => {
    page.sections.sort((a, b) => {
      if (a.order === null && b.order === null) return 0;
      if (a.order === null) return 1;
      if (b.order === null) return -1;
      return a.order - b.order;
    });
  });

  Object.values(manifest.surfaces).forEach((surface) => {
    Object.values(surface.routes ?? {}).forEach((route) => {
      Object.values(route.slots ?? {}).forEach((slot) => {
        slot.sections.sort((a, b) => {
          if (a.order === null && b.order === null) return 0;
          if (a.order === null) return 1;
          if (b.order === null) return -1;
          return a.order - b.order;
        });
      });
    });
  });

  return manifest;
};
