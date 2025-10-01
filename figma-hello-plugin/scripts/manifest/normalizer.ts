// doc_refs: ["admin/plan/figmapluginmake.md"]

import path from 'node:path';

import { normalizePadding, titleCase } from './utils';
import type {
  PageSectionsResult,
  RawSurfaceDefinition,
  SectionFile,
  SectionFileRaw,
  SlotDefinitionRaw,
  SurfaceFileRaw,
  SurfaceMap,
} from './types';

interface SurfaceFileEntry {
  filePath: string;
  surface: SurfaceFileRaw;
}

interface SectionFileEntry {
  page: string;
  filePath: string;
  section: SectionFileRaw;
  raw: string;
}

export const normalizeSurfaces = (entries: SurfaceFileEntry[]): SurfaceMap => {
  const surfaces: SurfaceMap = {};

  entries.forEach(({ surface }) => {
    const layout = surface.layout ?? {};
    const normalizedSlots: RawSurfaceDefinition['slots'] = {};

    const slotList: SlotDefinitionRaw[] = Array.isArray(surface.slots) ? surface.slots : [];

    slotList.forEach((slot) => {
      const slotId = String(slot.id);
      normalizedSlots[slotId] = {
        id: slotId,
        label: slot.label || titleCase(slotId),
        parent: typeof slot.parent === 'string' ? slot.parent : null,
        layout:
          slot.layout === 'HORIZONTAL'
            ? 'HORIZONTAL'
            : slot.layout === 'VERTICAL'
              ? 'VERTICAL'
              : undefined,
        spacing: typeof slot.spacing === 'number' ? slot.spacing : undefined,
        padding: normalizePadding(slot.padding),
        width:
          typeof slot.width === 'number' || slot.width === 'hug' || slot.width === 'fill'
            ? slot.width
            : undefined,
        height: typeof slot.height === 'number' || slot.height === 'hug' ? slot.height : undefined,
        grow: typeof slot.grow === 'number' ? slot.grow : undefined,
        allowedSections: Array.isArray(slot.allowedSections)
          ? Array.from(new Set(slot.allowedSections.map((item) => String(item))))
          : [],
      };
    });

    surfaces[surface.id] = {
      id: surface.id,
      label: surface.label || titleCase(surface.id),
      layout: {
        width: typeof layout.width === 'number' ? layout.width : 900,
        height:
          typeof layout.height === 'number' ? layout.height : layout.height === null ? null : null,
        padding: normalizePadding(layout?.padding),
        spacing: typeof layout.spacing === 'number' ? layout.spacing : 0,
        background: layout.background ?? null,
      },
      slots: normalizedSlots,
      routes: surface.routes ?? {},
      requiredSlots: Array.isArray(surface.requiredSlots)
        ? Array.from(new Set(surface.requiredSlots.map((item) => String(item))))
        : [],
    };
  });

  return surfaces;
};

export const normalizePageSections = (entries: SectionFileEntry[]): PageSectionsResult[] => {
  const grouped = new Map<string, SectionFile[]>();

  entries.forEach(({ page, filePath, section, raw }) => {
    const meta = section.meta ?? {};

    const defaultsId = path.basename(filePath, '.json');

    const order = typeof meta.order === 'number' ? meta.order : null;
    const sectionId =
      typeof meta.section === 'string' && meta.section.trim().length > 0
        ? meta.section
        : defaultsId;
    const label =
      typeof meta.label === 'string' && meta.label.trim().length > 0
        ? meta.label
        : titleCase(sectionId);
    const description = typeof meta.description === 'string' ? meta.description : '';

    const designSurfaceRaw =
      typeof meta.designSurface === 'string' && meta.designSurface.trim().length > 0
        ? meta.designSurface
        : 'admin';
    const designSurface = designSurfaceRaw.toLowerCase();
    const designSurfaceLabel =
      typeof meta.designSurfaceLabel === 'string' && meta.designSurfaceLabel.trim().length > 0
        ? meta.designSurfaceLabel
        : titleCase(designSurface.replace(/[-_]/g, ' '));

    const route =
      typeof meta.route === 'string' && meta.route.trim().length > 0
        ? meta.route
        : `/admin/${page}`;
    const routeLabel =
      typeof meta.routeLabel === 'string' && meta.routeLabel.trim().length > 0
        ? meta.routeLabel
        : titleCase(route.replace(/\//g, ' ').trim());

    const slotRaw =
      typeof meta.slot === 'string' && meta.slot.trim().length > 0 ? meta.slot : 'main';
    const slot = slotRaw.toLowerCase();
    const slotLabel =
      typeof meta.slotLabel === 'string' && meta.slotLabel.trim().length > 0
        ? meta.slotLabel
        : titleCase(slot.replace(/[-_]/g, ' '));

    const normalized: SectionFile = {
      id: `${page}/sections/${path.basename(filePath)}`,
      sectionId,
      order,
      label,
      description,
      raw,
      designSurface,
      designSurfaceLabel,
      route,
      routeLabel,
      slot,
      slotLabel,
    };

    if (!grouped.has(page)) {
      grouped.set(page, []);
    }
    grouped.get(page)!.push(normalized);
  });

  const results: PageSectionsResult[] = [];

  Array.from(grouped.keys())
    .sort()
    .forEach((page) => {
      const sections = grouped.get(page)!;
      sections.sort((a, b) => {
        if (a.order === null && b.order === null) return 0;
        if (a.order === null) return 1;
        if (b.order === null) return -1;
        return a.order - b.order;
      });
      results.push({ page, sections });
    });

  return results;
};

export type { SurfaceFileEntry, SectionFileEntry };
