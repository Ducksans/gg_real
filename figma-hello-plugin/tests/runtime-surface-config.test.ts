import { describe, expect, it } from 'vitest';

import { normalizeSurfaceManifest } from '@runtime/surface-config/normalizer';

describe('surface-config normalizer', () => {
  const surfaces = normalizeSurfaceManifest();
  const pluginSurface = surfaces.find((surface) => surface.id === 'plugin');

  it('lowercases surface and slot identifiers', () => {
    expect(pluginSurface).toBeDefined();
    expect(pluginSurface?.id).toBe('plugin');
    expect(Object.keys(pluginSurface?.slots ?? {})).toContain('tree');
    const parent = pluginSurface?.slots.tree?.parent;
    if (parent) {
      expect(parent).toBe(parent.toLowerCase());
    }
  });

  it('deduplicates allowed sections per slot', () => {
    const headerSlot = pluginSurface?.slots.header;
    expect(headerSlot).toBeDefined();
    const allowed = headerSlot?.allowedSections ?? [];
    expect(new Set(allowed).size).toBe(allowed.length);
  });

  it('normalizes route summaries with lower-case slot keys', () => {
    const routeEntries = Object.entries(pluginSurface?.routes ?? {});
    expect(routeEntries.length).toBeGreaterThan(0);
    routeEntries.forEach(([routeId, summary]) => {
      expect(typeof routeId).toBe('string');
      const slotKeys = Object.keys(summary.slots ?? {});
      slotKeys.forEach((slotKey) => {
        expect(slotKey).toBe(slotKey.toLowerCase());
      });
    });
  });
});
