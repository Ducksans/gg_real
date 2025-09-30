// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import type { SchemaDocument } from '../../schema';
import type { ArchetypeManifest, ArchetypeSection } from '../../lib/archetype-manifest';
import { archetypeManifest as defaultManifest } from '../../lib/archetype-manifest';

export interface SectionInfo {
  readonly id: string;
  readonly label: string;
  readonly slotId?: string;
  readonly slotLabel?: string;
  readonly order?: number;
  readonly description?: string;
  readonly sectionId?: string;
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

interface SectionRecord extends SectionInfo {
  raw: string;
}

let manifest: ArchetypeManifest = defaultManifest;
const sectionMap = new Map<string, SectionRecord>();
const surfaceMap = new Map<string, SurfaceInfo>();
const slotLookup = new Map<string, SurfaceSlotInfo & { surfaceId: string }>();

const slotKey = (surfaceId: string, slotId: string) => `${surfaceId}:${slotId}`;

const normaliseManifest = (data: ArchetypeManifest) => {
  sectionMap.clear();
  surfaceMap.clear();
  slotLookup.clear();

  const registerSection = (section: ArchetypeSection) => {
    if (sectionMap.has(section.id)) return;
    sectionMap.set(section.id, {
      id: section.id,
      label: section.label,
      slotId: section.slot,
      slotLabel: section.slotLabel,
      order: section.order ?? undefined,
      description: section.description,
      sectionId: section.sectionId,
      raw: section.raw,
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
  });
};

normaliseManifest(defaultManifest);

export const registerArchetypeManifest = (data: ArchetypeManifest) => {
  manifest = data;
  normaliseManifest(data);
};

export const getAvailableSections = (): SectionInfo[] => {
  const sections = Array.from(sectionMap.values());
  return sortSections(sections).map(({ raw: _raw, ...rest }) => rest);
};

const parseSchema = (raw: string): SchemaDocument | null => {
  try {
    return JSON.parse(raw) as SchemaDocument;
  } catch (error) {
    console.error('[schema-builder] Failed to parse section schema', error);
    return null;
  }
};

export const buildSchemaDocuments = (sectionIds: string[]): SchemaDocument[] => {
  const documents: SchemaDocument[] = [];
  sectionIds.forEach((id) => {
    const record = sectionMap.get(id);
    if (!record) return;
    const doc = parseSchema(record.raw);
    if (doc) {
      documents.push(doc);
    }
  });
  return documents;
};

export const getSectionInfo = (sectionId: string): SectionInfo | undefined => {
  const record = sectionMap.get(sectionId);
  if (!record) return undefined;
  const { raw: _raw, ...info } = record;
  return info;
};

export const getManifest = () => manifest;

export const getSurfaces = (): SurfaceInfo[] =>
  Array.from(surfaceMap.values()).map((surface) => ({
    id: surface.id,
    label: surface.label,
    requiredSlots: [...surface.requiredSlots],
    slots: surface.slots.map((slot) => ({
      id: slot.id,
      label: slot.label,
      parent: slot.parent ?? null,
      allowedSectionIds: [...slot.allowedSectionIds],
    })),
  }));

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

export const getSectionsForSlot = (surfaceId: string, slotId: string): SectionInfo[] => {
  const slot = slotLookup.get(slotKey(surfaceId, slotId));
  const records = Array.from(sectionMap.values());
  const filtered =
    !slot || slot.allowedSectionIds.length === 0
      ? records
      : records.filter((section) =>
          section.sectionId ? slot.allowedSectionIds.includes(section.sectionId) : false,
        );
  return sortSections(filtered).map(({ raw: _raw, ...rest }) => rest);
};
