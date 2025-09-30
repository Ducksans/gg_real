#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../admin/specs/ui-archetypes');
const outputPath = path.resolve(__dirname, '../src/lib/archetype-manifest.ts');
const surfacesDir = path.join(rootDir, 'surfaces');

function titleCase(str) {
  return str
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizePadding(padding) {
  if (!padding || typeof padding !== 'object') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  const { top = 0, right = 0, bottom = 0, left = 0 } = padding;
  return { top, right, bottom, left };
}

function loadSurfaceDefinitions() {
  if (!fs.existsSync(surfacesDir)) {
    return {};
  }

  const files = fs.readdirSync(surfacesDir).filter((file) => file.endsWith('.json'));
  const surfaces = {};

  files.forEach((file) => {
    const filePath = path.join(surfacesDir, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(`Surface JSON 파싱 실패: ${filePath} — ${error.message}`);
    }

    if (!parsed?.id) {
      throw new Error(`Surface 정의에 id가 없습니다: ${filePath}`);
    }

    const slotEntries = Array.isArray(parsed.slots) ? parsed.slots : [];
    const slots = {};
    slotEntries.forEach((slot) => {
      if (!slot?.id) {
        throw new Error(`Surface ${parsed.id}에 slot id가 없습니다 (${filePath})`);
      }
      const normalizedId = String(slot.id);
      slots[normalizedId] = {
        id: normalizedId,
        label: slot.label || titleCase(normalizedId),
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
      routes: {},
      requiredSlots: Array.isArray(parsed.requiredSlots)
        ? Array.from(new Set(parsed.requiredSlots))
        : [],
    };
  });

  return surfaces;
}

function cloneSurfaces(definitions) {
  const cloned = {};
  Object.entries(definitions).forEach(([key, surface]) => {
    cloned[key] = {
      id: surface.id,
      label: surface.label,
      layout: {
        width: surface.layout.width,
        height: surface.layout.height ?? null,
        padding: normalizePadding(surface.layout.padding),
        spacing: surface.layout.spacing ?? 0,
        background: surface.layout.background ?? null,
      },
      slots: {},
      routes: {},
      requiredSlots: Array.isArray(surface.requiredSlots) ? [...surface.requiredSlots] : [],
    };

    Object.entries(surface.slots).forEach(([slotId, slot]) => {
      cloned[key].slots[slotId] = {
        id: slot.id,
        label: slot.label,
        parent: slot.parent ?? null,
        layout: slot.layout,
        spacing: slot.spacing,
        padding: normalizePadding(slot.padding),
        width: slot.width,
        height: slot.height,
        grow: slot.grow,
        allowedSections: Array.isArray(slot.allowedSections) ? [...slot.allowedSections] : [],
      };
    });
  });
  return cloned;
}

function readSections(pageName, sectionsDir) {
  if (!fs.existsSync(sectionsDir)) return [];
  const files = fs
    .readdirSync(sectionsDir)
    .filter((file) => file.endsWith('.json'))
    .sort();

  return files.map((file) => {
    const filePath = path.join(sectionsDir, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(`JSON 파싱 실패: ${filePath} — ${error.message}`);
    }

    const order = typeof parsed?.meta?.order === 'number' ? parsed.meta.order : null;
    const sectionId = parsed?.meta?.section || file.replace(/\.json$/, '');
    const label = titleCase(sectionId);

    const designSurface = (parsed?.meta?.designSurface || 'admin').toLowerCase();
    const designSurfaceLabel =
      parsed?.meta?.designSurfaceLabel || titleCase(designSurface.replace(/[-_]/g, ' '));
    const route = parsed?.meta?.route || `/admin/${pageName}`;
    const routeLabel = parsed?.meta?.routeLabel || titleCase(pageName);
    const slot = (parsed?.meta?.slot || 'main').toLowerCase();
    const slotLabel = parsed?.meta?.slotLabel || titleCase(slot.replace(/[-_]/g, ' '));

    return {
      id: `${pageName}/sections/${file}`,
      sectionId,
      order,
      label,
      description: parsed?.meta?.description || '',
      raw,
      designSurface,
      designSurfaceLabel,
      route,
      routeLabel,
      slot,
      slotLabel,
    };
  });
}

function ensureSurface(manifest, surfaceId, label) {
  if (!manifest.surfaces[surfaceId]) {
    manifest.surfaces[surfaceId] = {
      id: surfaceId,
      label: label || titleCase(surfaceId),
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
}

function ensureSurfaceSlot(surface, slotId, slotLabel) {
  if (!surface.slots[slotId]) {
    surface.slots[slotId] = {
      id: slotId,
      label: slotLabel || titleCase(slotId),
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
}

function ensureSurfaceRoute(surface, routeId, routeLabel) {
  if (!surface.routes[routeId]) {
    surface.routes[routeId] = {
      label: routeLabel || titleCase(routeId),
      slots: {},
    };
  }
  return surface.routes[routeId];
}

function buildManifest() {
  if (!fs.existsSync(rootDir)) {
    throw new Error(`아키타입 디렉터리를 찾을 수 없습니다: ${rootDir}`);
  }

  const surfaceDefinitions = cloneSurfaces(loadSurfaceDefinitions());

  const pages = fs
    .readdirSync(rootDir)
    .filter((name) => fs.statSync(path.join(rootDir, name)).isDirectory())
    .sort();

  const manifest = {
    generatedAt: new Date().toISOString(),
    surfaces: surfaceDefinitions,
    routes: {},
    pages: {},
  };

  for (const page of pages) {
    const sectionsDir = path.join(rootDir, page, 'sections');
    const sections = readSections(page, sectionsDir);

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
      const {
        designSurface,
        designSurfaceLabel,
        route,
        routeLabel,
        slot,
        slotLabel,
        sectionId,
        ...rest
      } = section;

      const surfaceEntry = ensureSurface(manifest, designSurface, designSurfaceLabel);
      const slotEntry = ensureSurfaceSlot(surfaceEntry, slot, slotLabel);
      if (!slotEntry.allowedSections.includes(sectionId)) {
        slotEntry.allowedSections.push(sectionId);
      }

      const surfaceRoute = ensureSurfaceRoute(surfaceEntry, route, routeLabel);
      if (!surfaceRoute.slots[slot]) {
        surfaceRoute.slots[slot] = {
          label: slotLabel,
          sections: [],
        };
      }
      surfaceRoute.slots[slot].sections.push({
        id: section.id,
        sectionId,
        order: section.order,
        label: section.label,
        description: section.description,
        raw: section.raw,
        slot,
        slotLabel,
      });

      if (!manifest.routes[route]) {
        manifest.routes[route] = {
          label: routeLabel,
          slots: {},
        };
      }
      if (!manifest.routes[route].slots[slot]) {
        manifest.routes[route].slots[slot] = {
          label: slotLabel,
          sections: [],
        };
      }

      manifest.routes[route].slots[slot].sections.push({
        ...rest,
        sectionId,
        slot,
        slotLabel,
      });
    });
  }

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
    Object.values(surface.routes).forEach((route) => {
      Object.values(route.slots).forEach((slot) => {
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
}

function emit(manifest) {
  const header = `/* eslint-disable */\n// This file is auto-generated by scripts/build-archetype-manifest.js\n// Do not edit manually.\n`;
  const content = `${header}\nexport interface BoxSpacing {\n  top?: number;\n  right?: number;\n  bottom?: number;\n  left?: number;\n}\n\nexport interface ArchetypeSection {\n  id: string;\n  sectionId: string;\n  order: number | null;\n  label: string;\n  description: string;\n  slot: string;\n  slotLabel: string;\n  raw: string;\n}\n\nexport interface ArchetypeSlotSummary {\n  label: string;\n  sections: ArchetypeSection[];\n}\n\nexport interface ArchetypeRoute {\n  label: string;\n  slots: Record<string, ArchetypeSlotSummary>;\n}\n\nexport interface ArchetypePage {\n  label: string;\n  sections: ArchetypeSection[];\n}\n\nexport interface ArchetypeSurfaceSlot {\n  id: string;\n  label: string;\n  parent: string | null;\n  layout?: 'VERTICAL' | 'HORIZONTAL';\n  spacing?: number;\n  padding: BoxSpacing;\n  width?: number | 'hug' | 'fill';\n  height?: number | 'hug';\n  grow?: number;\n  allowedSections: string[];\n}\n\nexport interface ArchetypeSurfaceLayout {\n  width: number;\n  height?: number | null;\n  padding: BoxSpacing;\n  spacing?: number;\n  background?: string | null;\n}\n\nexport interface ArchetypeSurface {\n  id: string;\n  label: string;\n  layout: ArchetypeSurfaceLayout;\n  slots: Record<string, ArchetypeSurfaceSlot>;\n  requiredSlots: string[];\n}\n\nexport interface ArchetypeManifest {\n  generatedAt: string;\n  surfaces: Record<string, ArchetypeSurface>;\n  routes: Record<string, ArchetypeRoute>;\n  pages: Record<string, ArchetypePage>;\n}\n\nexport const archetypeManifest: ArchetypeManifest = ${JSON.stringify(
    manifest,
    null,
    2,
  )};\n`;

  fs.writeFileSync(outputPath, content, 'utf8');
}

try {
  const manifest = buildManifest();
  emit(manifest);
  console.log(`[build-archetype-manifest] Generated manifest at ${outputPath}`);
} catch (error) {
  console.error('[build-archetype-manifest] Error:', error.message);
  process.exit(1);
}
