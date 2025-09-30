import type { SchemaDocument } from '../../schema';

import { normalizeSurfaceManifest } from './normalizer';
import type { SurfaceConfig, SurfaceRegistry } from './types';

const DEFAULT_SURFACE_ID = 'plugin';

const FALLBACK_SURFACE: SurfaceConfig = {
  id: DEFAULT_SURFACE_ID,
  label: 'Plugin UI',
  width: 900,
  height: 600,
  padding: { top: 24, right: 24, bottom: 24, left: 24 },
  spacing: 20,
  background: null,
  slots: {
    header: {
      id: 'header',
      label: 'Header',
      parent: null,
      layout: 'HORIZONTAL',
      spacing: 16,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      allowedSections: [],
    },
    top: {
      id: 'top',
      label: 'Top',
      parent: null,
      layout: 'VERTICAL',
      spacing: 16,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      allowedSections: [],
    },
    body: {
      id: 'body',
      label: 'Body Columns',
      parent: null,
      layout: 'HORIZONTAL',
      spacing: 20,
      padding: { top: 8, right: 0, bottom: 0, left: 0 },
      allowedSections: [],
    },
    nav: {
      id: 'nav',
      label: 'Route / Slot Tree',
      parent: 'body',
      layout: 'VERTICAL',
      spacing: 16,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      width: 280,
      allowedSections: [],
    },
    main: {
      id: 'main',
      label: 'Main Panel',
      parent: 'body',
      layout: 'VERTICAL',
      spacing: 16,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      grow: 1,
      allowedSections: [],
    },
    log: {
      id: 'log',
      label: 'Result Log',
      parent: null,
      layout: 'VERTICAL',
      spacing: 12,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      allowedSections: [],
    },
  },
  routes: {},
  requiredSlots: [],
};

let registryCache: SurfaceRegistry | null = null;

const buildRegistry = (): SurfaceRegistry => {
  const entries = normalizeSurfaceManifest();
  const byId: Record<string, SurfaceConfig> = {};

  entries.forEach((surface) => {
    byId[surface.id] = surface;
  });

  if (!byId[DEFAULT_SURFACE_ID]) {
    if (entries.length > 0) {
      byId[DEFAULT_SURFACE_ID] = entries[0];
    } else {
      byId[DEFAULT_SURFACE_ID] = FALLBACK_SURFACE;
    }
  }

  return {
    byId,
    defaultSurfaceId: byId[DEFAULT_SURFACE_ID].id,
  };
};

const getRegistry = (): SurfaceRegistry => {
  if (!registryCache) {
    registryCache = buildRegistry();
  }
  return registryCache;
};

export const resolveSurfaceConfig = (meta?: SchemaDocument['meta']): SurfaceConfig => {
  const registry = getRegistry();
  if (meta?.designSurface) {
    const candidate = registry.byId[meta.designSurface.toLowerCase()];
    if (candidate) {
      return candidate;
    }
  }
  return registry.byId[registry.defaultSurfaceId] ?? FALLBACK_SURFACE;
};

export const listRequiredSlots = (surfaceId: string): string[] => {
  const registry = getRegistry();
  const target = registry.byId[surfaceId] ?? registry.byId[registry.defaultSurfaceId];
  return target?.requiredSlots ?? [];
};

export const listSurfaceConfigs = (): SurfaceConfig[] => Object.values(getRegistry().byId);

export const resetSurfaceRegistry = () => {
  registryCache = null;
};
