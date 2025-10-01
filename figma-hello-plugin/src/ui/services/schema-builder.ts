import type { SchemaDocument } from '../../schema';
import type { ArchetypeManifest, ArchetypeSection } from '../../lib/archetype-manifest';
import { archetypeManifest as defaultManifest } from '../../lib/archetype-manifest';
import { guardrailThresholds, measureNodeGraph } from '../../shared/guardrails';

export interface SectionInfo {
  readonly id: string;
  readonly label: string;
  readonly slotId?: string;
  readonly slotLabel?: string;
  readonly order?: number;
  readonly description?: string;
  readonly sectionId?: string;
  readonly guardrail?: GuardrailLevel;
  readonly guardrailMetrics?: GuardrailMetrics;
}

export type GuardrailLevel = 'normal' | 'warn' | 'fail';

export interface GuardrailMetrics {
  readonly nodeCount: number;
  readonly depth: number;
  readonly fileSize: number;
}

export interface SurfaceSlotInfo {
  readonly id: string;
  readonly label: string;
  readonly parent?: string | null;
  readonly allowedSectionIds: string[];
}

export interface SurfaceInfo {
  readonly id: string;
  readonly label: string;
  readonly requiredSlots: string[];
  readonly slots: SurfaceSlotInfo[];
}

export interface RouteSlotInfo {
  readonly id: string;
  readonly label: string;
  readonly sections: SectionInfo[];
  readonly allowedSectionIds: string[];
}

export interface RouteInfo {
  readonly id: string;
  readonly label: string;
  readonly slots: RouteSlotInfo[];
}

export interface SurfaceRouteTree {
  readonly id: string;
  readonly label: string;
  readonly routes: RouteInfo[];
  readonly requiredSlots: string[];
}

interface SectionRecord extends SectionInfo {
  raw: string;
  doc: SchemaDocument | null;
}

let manifest: ArchetypeManifest = defaultManifest;
const sectionMap = new Map<string, SectionRecord>();
const surfaceMap = new Map<string, SurfaceInfo>();
const slotLookup = new Map<string, SurfaceSlotInfo & { surfaceId: string }>();
const surfaceRouteMap = new Map<string, RouteInfo[]>();
const surfaceMetaMap = new Map<string, { label: string; order: number }>();

const slotKey = (surfaceId: string, slotId: string) => `${surfaceId}:${slotId}`;

const normaliseManifest = (data: ArchetypeManifest) => {
  sectionMap.clear();
  surfaceMap.clear();
  slotLookup.clear();
  surfaceRouteMap.clear();

  const registerSection = (section: ArchetypeSection) => {
    if (sectionMap.has(section.id)) return;

    const analysis = analyseSection(section.raw);
    sectionMap.set(section.id, {
      id: section.id,
      label: section.label,
      slotId: section.slot,
      slotLabel: section.slotLabel,
      order: section.order ?? undefined,
      description: section.description,
      sectionId: section.sectionId,
      guardrail: analysis.guardrail,
      guardrailMetrics: analysis.metrics,
      raw: section.raw,
      doc: analysis.doc,
    });
  };

  Object.values(data.routes).forEach((route) => {
    Object.values(route.slots).forEach((slotSummary) => {
      slotSummary.sections.forEach(registerSection);
    });
  });

  Object.values(data.pages).forEach((page) => {
    page.sections.forEach(registerSection);
  });

  Object.entries(data.surfaces).forEach(([surfaceId, surface]) => {
    const surfaceInfo: SurfaceInfo = {
      id: surfaceId,
      label: surface.label,
      requiredSlots: surface.requiredSlots ?? [],
      slots: [],
    };

    const routes: RouteInfo[] = [];

    Object.entries(surface.slots).forEach(([slotId, slot]) => {
      const slotInfo: SurfaceSlotInfo = {
        id: slotId,
        label: slot.label,
        parent: slot.parent ?? null,
        allowedSectionIds: slot.allowedSections ?? [],
      };
      surfaceInfo.slots.push(slotInfo);
      slotLookup.set(slotKey(surfaceId, slotId), { ...slotInfo, surfaceId });
    });

    surfaceInfo.slots.sort((a, b) => a.label.localeCompare(b.label));
    surfaceMap.set(surfaceId, surfaceInfo);

    Object.entries(surface.routes ?? {}).forEach(([routeId, route]) => {
      const slots: RouteSlotInfo[] = Object.entries(route.slots ?? {}).map(([slotId, slot]) => {
        const sections = slot.sections
          .map((section) => sectionMap.get(section.id))
          .filter((section): section is SectionRecord => Boolean(section))
          .map(({ raw: _raw, doc: _doc, ...rest }) => rest);

        const allowedIds = Array.from(
          new Set(
            slot.sections
              .map((section) => section.sectionId)
              .filter((value): value is string => Boolean(value)),
          ),
        );

        return {
          id: slotId,
          label: slot.label ?? slotId,
          sections,
          allowedSectionIds: allowedIds,
        } satisfies RouteSlotInfo;
      });

      slots.sort((a, b) => a.label.localeCompare(b.label));

      routes.push({
        id: routeId,
        label: route.label ?? routeId,
        slots,
      });
    });

    routes.sort((a, b) => a.label.localeCompare(b.label));
    surfaceRouteMap.set(surfaceId, routes);
  });
};

normaliseManifest(defaultManifest);

export const registerArchetypeManifest = (data: ArchetypeManifest) => {
  manifest = data;
  normaliseManifest(data);
};

interface SurfaceMetaInput {
  surfaceId: string;
  label: string;
}

export const registerSurfacePages = (pages: SurfaceMetaInput[]) => {
  surfaceMetaMap.clear();
  const canonicalOrder = ['admin', 'plugin', 'shared'];
  const seen = new Set<string>();
  pages.forEach((page, index) => {
    const key = page.surfaceId.trim();
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    const canonicalIndex = canonicalOrder.indexOf(key);
    const order = canonicalIndex >= 0 ? canonicalIndex : canonicalOrder.length + index;
    surfaceMetaMap.set(key, { label: page.label || key, order });
  });

  canonicalOrder.forEach((surfaceId, canonicalIndex) => {
    if (!surfaceMetaMap.has(surfaceId)) {
      const fallbackLabel =
        surfaceId === 'admin' ? 'Admin' : surfaceId === 'plugin' ? 'User' : 'Common';
      surfaceMetaMap.set(surfaceId, { label: fallbackLabel, order: canonicalIndex });
    }
  });
};

export const getAvailableSections = (): SectionInfo[] => {
  const sections = Array.from(sectionMap.values());
  return sortSections(sections).map(({ raw: _raw, doc: _doc, ...rest }) => rest);
};

function analyseSection(raw: string): {
  doc: SchemaDocument | null;
  guardrail: GuardrailLevel;
  metrics: GuardrailMetrics | undefined;
} {
  try {
    const doc = JSON.parse(raw) as SchemaDocument;
    const { count, maxDepth } = measureNodeGraph(doc.nodes ?? []);
    const fileSize = raw.length;

    const metrics: GuardrailMetrics = {
      nodeCount: count,
      depth: maxDepth,
      fileSize,
    };

    if (count >= guardrailThresholds.fail.nodeCount) {
      return { doc, guardrail: 'fail', metrics };
    }
    if (count >= guardrailThresholds.warn.nodeCount) {
      return { doc, guardrail: 'warn', metrics };
    }
    return { doc, guardrail: 'normal', metrics };
  } catch (error) {
    console.error('[schema-builder] Failed to parse section schema', error);
    return { doc: null, guardrail: 'normal', metrics: undefined };
  }
}

export const buildSchemaDocuments = (sectionIds: string[]): SchemaDocument[] => {
  const documents: SchemaDocument[] = [];
  sectionIds.forEach((id) => {
    const record = sectionMap.get(id);
    if (!record?.doc) return;
    const cloned = JSON.parse(JSON.stringify(record.doc)) as SchemaDocument;
    documents.push(cloned);
  });
  return documents;
};

export const getSectionInfo = (sectionId: string): SectionInfo | undefined => {
  const record = sectionMap.get(sectionId);
  if (!record) return undefined;
  const { raw: _raw, doc: _doc, ...info } = record;
  return info;
};

export const getManifest = () => manifest;

export const getSurfaces = (): SurfaceInfo[] => {
  const surfacesWithOrder = Array.from(surfaceMap.values()).map((surface) => {
    const meta = surfaceMetaMap.get(surface.id);
    return {
      id: surface.id,
      label: meta?.label ?? surface.label,
      requiredSlots: [...surface.requiredSlots],
      slots: surface.slots.map((slot) => ({
        id: slot.id,
        label: slot.label,
        parent: slot.parent ?? null,
        allowedSectionIds: [...slot.allowedSectionIds],
      })),
      order: meta?.order ?? Number.MAX_SAFE_INTEGER,
    };
  });

  surfaceMetaMap.forEach((meta, surfaceId) => {
    const exists = surfacesWithOrder.some((surface) => surface.id === surfaceId);
    if (!exists) {
      surfacesWithOrder.push({
        id: surfaceId,
        label: meta.label,
        requiredSlots: [],
        slots: [],
        order: meta.order,
      });
    }
  });

  return surfacesWithOrder
    .sort((a, b) => a.order - b.order)
    .map(({ order: _order, ...surface }) => surface);
};

export const getRouteTree = (): SurfaceRouteTree[] =>
  Array.from(surfaceRouteMap.entries())
    .map(([surfaceId, routes]) => {
      const surface = surfaceMap.get(surfaceId);
      const meta = surfaceMetaMap.get(surfaceId);
      return {
        id: surfaceId,
        label: meta?.label ?? surface?.label ?? surfaceId,
        requiredSlots: surface?.requiredSlots ?? [],
        order: meta?.order ?? Number.MAX_SAFE_INTEGER,
        routes: routes.map((route) => ({
          ...route,
          slots: route.slots.map((slot) => ({
            ...slot,
            sections: slot.sections.map((section) => ({ ...section })),
            allowedSectionIds: [...slot.allowedSectionIds],
          })),
        })),
      } satisfies SurfaceRouteTree & { order: number };
    })
    .concat(
      Array.from(surfaceMetaMap.entries())
        .filter(([surfaceId]) => !surfaceRouteMap.has(surfaceId))
        .map(
          ([surfaceId, meta]) =>
            ({
              id: surfaceId,
              label: meta.label,
              requiredSlots: [],
              routes: [],
              order: meta.order,
            }) satisfies SurfaceRouteTree & { order: number },
        ),
    )
    .sort((a, b) => a.order - b.order)
    .map(({ order: _order, ...surface }) => surface);

const sortSections = (sections: SectionRecord[]) =>
  [...sections].sort((a, b) => {
    if (a.order == null && b.order == null) {
      return a.label.localeCompare(b.label);
    }
    if (a.order == null) return 1;
    if (b.order == null) return -1;
    if (a.order === b.order) return a.label.localeCompare(b.label);
    return a.order - b.order;
  });

export const getSectionsForRouteSlot = (
  surfaceId: string,
  routeId: string,
  slotId: string,
): SectionInfo[] => {
  const routes = surfaceRouteMap.get(surfaceId) ?? [];
  const route = routes.find((item) => item.id === routeId);
  const slot = route?.slots.find((item) => item.id === slotId);
  if (!slot) return [];
  return slot.sections.map((section) => ({ ...section }));
};
