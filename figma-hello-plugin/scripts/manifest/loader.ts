import fs from 'node:fs';
import path from 'node:path';

import { normalizePadding, titleCase } from './utils';
import type { RawSurfaceDefinition, SectionFile } from './types';

const ROOT = path.resolve(__dirname, '../../..', 'admin/specs/ui-archetypes');
const SURFACES_DIR = path.join(ROOT, 'surfaces');

export interface SurfaceMap {
  [key: string]: RawSurfaceDefinition;
}

export const loadSurfaceDefinitions = (): SurfaceMap => {
  if (!fs.existsSync(SURFACES_DIR)) {
    return {};
  }

  const entries = fs.readdirSync(SURFACES_DIR).filter((file) => file.endsWith('.json'));

  const surfaces: SurfaceMap = {};

  entries.forEach((file) => {
    const filePath = path.join(SURFACES_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    let parsed: RawSurfaceDefinition | undefined;

    try {
      parsed = JSON.parse(raw) as RawSurfaceDefinition;
    } catch (error) {
      throw new Error(`Surface JSON 파싱 실패: ${filePath} — ${(error as Error).message}`);
    }

    if (!parsed?.id) {
      throw new Error(`Surface 정의에 id가 없습니다: ${filePath}`);
    }

    const slotEntries = Array.isArray(parsed.slots) ? parsed.slots : [];
    const slots: RawSurfaceDefinition['slots'] = {};
    slotEntries.forEach((slot) => {
      const slotId = String(slot.id);
      slots[slotId] = {
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

    surfaces[parsed.id] = {
      id: parsed.id,
      label: parsed.label || titleCase(parsed.id),
      layout: {
        width: parsed.layout?.width ?? 900,
        height: parsed.layout?.height ?? null,
        padding: normalizePadding(parsed.layout?.padding),
        spacing: parsed.layout?.spacing ?? 0,
        background: parsed.layout?.background ?? null,
      },
      slots,
      routes: parsed.routes ?? {},
      requiredSlots: Array.isArray(parsed.requiredSlots)
        ? Array.from(new Set(parsed.requiredSlots.map((item) => String(item))))
        : [],
    };
  });

  return surfaces;
};

export interface PageSectionsResult {
  page: string;
  sections: SectionFile[];
}

export const loadPageSections = (): PageSectionsResult[] => {
  if (!fs.existsSync(ROOT)) {
    throw new Error(`아키타입 디렉터리를 찾을 수 없습니다: ${ROOT}`);
  }

  const directories = fs
    .readdirSync(ROOT)
    .filter((entry) => fs.statSync(path.join(ROOT, entry)).isDirectory())
    .sort();

  return directories.map((page) => {
    const sectionsDir = path.join(ROOT, page, 'sections');

    if (!fs.existsSync(sectionsDir)) {
      return { page, sections: [] };
    }

    const files = fs
      .readdirSync(sectionsDir)
      .filter((file) => file.endsWith('.json'))
      .sort();

    const sections = files.map((file) => {
      const filePath = path.join(sectionsDir, file);
      const raw = fs.readFileSync(filePath, 'utf8');
      let parsed: any;

      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        throw new Error(`JSON 파싱 실패: ${filePath} — ${(error as Error).message}`);
      }

      const order = typeof parsed?.meta?.order === 'number' ? parsed.meta.order : null;
      const sectionId = parsed?.meta?.section || file.replace(/\.json$/, '');
      const label = parsed?.meta?.label || titleCase(sectionId);
      const description = parsed?.meta?.description || '';

      const designSurface = (parsed?.meta?.designSurface || 'admin').toLowerCase();
      const designSurfaceLabel =
        parsed?.meta?.designSurfaceLabel || titleCase(designSurface.replace(/[-_]/g, ' '));
      const route = parsed?.meta?.route || `/admin/${page}`;
      const routeLabel = parsed?.meta?.routeLabel || titleCase(route.replace(/\//g, ' ').trim());
      const slot = (parsed?.meta?.slot || 'main').toLowerCase();
      const slotLabel = parsed?.meta?.slotLabel || titleCase(slot.replace(/[-_]/g, ' '));

      return {
        id: `${page}/sections/${file}`,
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
      } satisfies SectionFile;
    });

    return { page, sections } satisfies PageSectionsResult;
  });
};
