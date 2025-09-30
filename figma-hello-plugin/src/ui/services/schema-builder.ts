// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import type { SchemaDocument } from '../../schema';
import type { ArchetypeManifest, ArchetypeSection } from '../../lib/archetype-manifest';
import { archetypeManifest as defaultManifest } from '../../lib/archetype-manifest';
import type { SectionInfo } from '../store/sectionStore';

interface SectionRecord extends SectionInfo {
  raw: string;
}

let manifest: ArchetypeManifest = defaultManifest;
const sectionMap = new Map<string, SectionRecord>();

const normaliseManifest = (data: ArchetypeManifest) => {
  sectionMap.clear();

  const registerSection = (section: ArchetypeSection) => {
    if (sectionMap.has(section.id)) return;
    sectionMap.set(section.id, {
      id: section.id,
      label: section.label,
      slotId: section.slot,
      slotLabel: section.slotLabel,
      order: section.order ?? undefined,
      description: section.description,
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

  Object.values(data.surfaces).forEach((surface) => {
    Object.values(surface.slots).forEach((slot) => {
      // surface.slot summaries are defined via routes already, skip duplicates
      (slot as any).sections?.forEach((section: ArchetypeSection) => {
        registerSection(section);
      });
    });
  });
};

normaliseManifest(defaultManifest);

export const registerArchetypeManifest = (data: ArchetypeManifest) => {
  manifest = data;
  normaliseManifest(data);
};

export const getAvailableSections = (): SectionInfo[] => {
  const sections = Array.from(sectionMap.values());
  return sections
    .sort((a, b) => {
      if (a.order == null && b.order == null) {
        return a.label.localeCompare(b.label);
      }
      if (a.order == null) return 1;
      if (b.order == null) return -1;
      if (a.order === b.order) return a.label.localeCompare(b.label);
      return a.order - b.order;
    })
    .map(({ raw: _raw, ...rest }) => rest);
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
