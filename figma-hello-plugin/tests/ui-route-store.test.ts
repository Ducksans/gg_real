import { beforeEach, describe, expect, it } from 'vitest';

import { createRouteStore } from '../src/ui/store/routeStore';
import { createSectionStore } from '../src/ui/store/sectionStore';
import type { ArchetypeManifest, ArchetypeSection } from '../src/lib/archetype-manifest';
import { registerArchetypeManifest, registerSurfacePages } from '../src/ui/services/schema-builder';
import type { SectionSelectionSnapshot } from '../src/ui/store/sectionStore';
import type { RouteSelectionSnapshot } from '../src/ui/store/routeStore';

const zeroPadding = { top: 0, right: 0, bottom: 0, left: 0 } as const;

const createSection = (id: string, slot: string, order: number): ArchetypeSection => ({
  id,
  sectionId: id,
  order,
  label: id.replace(/[:_-]/g, ' ').replace(/\s+/g, ' ').trim(),
  description: `${id} description`,
  slot,
  slotLabel: slot,
  raw: JSON.stringify({ id }),
});

const createManifest = (): ArchetypeManifest => {
  const adminNav = createSection('admin.nav.main', 'nav', 1);
  const adminContent = createSection('admin.content.summary', 'content', 2);
  const adminReport = createSection('admin.content.report', 'content', 3);
  const pluginPanel = createSection('plugin.panel.main', 'panel', 1);

  return {
    generatedAt: '2025-10-01T00:00:00.000Z',
    surfaces: {
      admin: {
        id: 'admin',
        label: 'Admin',
        layout: {
          width: 1200,
          height: 800,
          padding: zeroPadding,
          spacing: 16,
          background: null,
        },
        slots: {
          nav: {
            id: 'nav',
            label: 'Navigation',
            parent: null,
            layout: 'VERTICAL',
            spacing: 12,
            padding: zeroPadding,
            allowedSections: [adminNav.sectionId],
          },
          content: {
            id: 'content',
            label: 'Content',
            parent: null,
            layout: 'VERTICAL',
            spacing: 16,
            padding: zeroPadding,
            allowedSections: [adminContent.sectionId, adminReport.sectionId],
          },
        },
        routes: {
          dashboard: {
            label: 'Dashboard',
            slots: {
              nav: { label: 'Navigation', sections: [adminNav] },
              content: { label: 'Content', sections: [adminContent] },
            },
          },
          reports: {
            label: 'Reports',
            slots: {
              nav: { label: 'Navigation', sections: [adminNav] },
              content: { label: 'Content', sections: [adminReport] },
            },
          },
        },
        requiredSlots: [],
      },
      plugin: {
        id: 'plugin',
        label: 'Plugin',
        layout: {
          width: 900,
          height: 600,
          padding: zeroPadding,
          spacing: 20,
          background: null,
        },
        slots: {
          panel: {
            id: 'panel',
            label: 'Panel',
            parent: null,
            layout: 'VERTICAL',
            spacing: 16,
            padding: zeroPadding,
            allowedSections: [pluginPanel.sectionId],
          },
        },
        routes: {
          hello: {
            label: 'Hello',
            slots: {
              panel: { label: 'Panel', sections: [pluginPanel] },
            },
          },
        },
        requiredSlots: [],
      },
    },
    routes: {
      dashboard: {
        label: 'Dashboard',
        slots: {
          nav: { label: 'Navigation', sections: [adminNav] },
          content: { label: 'Content', sections: [adminContent] },
        },
      },
      reports: {
        label: 'Reports',
        slots: {
          nav: { label: 'Navigation', sections: [adminNav] },
          content: { label: 'Content', sections: [adminReport] },
        },
      },
      hello: {
        label: 'Hello',
        slots: {
          panel: { label: 'Panel', sections: [pluginPanel] },
        },
      },
    },
    pages: {
      admin: {
        label: 'Admin',
        sections: [adminNav, adminContent, adminReport],
      },
      plugin: {
        label: 'Plugin',
        sections: [pluginPanel],
      },
    },
  } satisfies ArchetypeManifest;
};

beforeEach(() => {
  registerArchetypeManifest(createManifest());
  registerSurfacePages([
    { surfaceId: 'admin', label: 'Admin Surface' },
    { surfaceId: 'plugin', label: 'Plugin Surface' },
  ]);
});

describe('routeStore snapshot handling', () => {
  it('captures the current selection and expansions', () => {
    const store = createRouteStore();
    store.load();

    const { selectedSurfaceId, selectedRouteId, selectedSlotId } = store.state.value;
    expect(selectedSurfaceId).toBe('admin');
    expect(selectedRouteId).toBe('dashboard');
    expect(selectedSlotId).toBe('content');
    expect(store.isRouteExpanded('admin', 'dashboard')).toBe(true);
    expect(store.isSlotExpanded('admin', 'dashboard', 'content')).toBe(true);

    const snapshot = store.takeSnapshot();
    expect(snapshot.surfaceId).toBe('admin');
    expect(snapshot.routeId).toBe('dashboard');
    expect(snapshot.slotId).toBe('content');
    expect(snapshot.expanded?.routes).toContainEqual({ surfaceId: 'admin', routeId: 'dashboard' });
    expect(snapshot.expanded?.slots).toContainEqual({
      surfaceId: 'admin',
      routeId: 'dashboard',
      slotId: 'content',
    });
  });

  it('restores a saved snapshot across instances', () => {
    const store = createRouteStore();
    store.load();

    store.selectSurface('plugin');
    store.selectRoute('plugin', 'hello');
    store.selectSlot('plugin', 'hello', 'panel');
    store.toggleRouteExpanded('admin', 'reports');
    store.toggleSlotExpanded('admin', 'reports', 'content');

    const snapshot = store.takeSnapshot();

    const restored = createRouteStore();
    restored.load();
    restored.restoreSnapshot(snapshot as RouteSelectionSnapshot);

    const { selectedSurfaceId, selectedRouteId, selectedSlotId } = restored.state.value;
    expect(selectedSurfaceId).toBe('plugin');
    expect(selectedRouteId).toBe('hello');
    expect(selectedSlotId).toBe('panel');
    expect(restored.isRouteExpanded('admin', 'reports')).toBe(true);
    expect(restored.isSlotExpanded('admin', 'reports', 'content')).toBe(true);
    expect(restored.isRouteExpanded('plugin', 'hello')).toBe(true);
    expect(restored.isSlotExpanded('plugin', 'hello', 'panel')).toBe(true);
  });

  it('falls back gracefully when snapshot references missing entities', () => {
    const store = createRouteStore();
    store.load();

    const invalidSnapshot: RouteSelectionSnapshot = {
      surfaceId: 'unknown-surface',
      routeId: 'missing-route',
      slotId: 'missing-slot',
      expanded: {
        routes: [{ surfaceId: 'unknown-surface', routeId: 'missing-route' }],
        slots: [{ surfaceId: 'admin', routeId: 'dashboard', slotId: 'missing-slot' }],
      },
    };

    store.restoreSnapshot(invalidSnapshot);

    const { selectedSurfaceId, selectedRouteId, selectedSlotId } = store.state.value;
    expect(selectedSurfaceId).toBe('admin');
    expect(selectedRouteId).toBe('dashboard');
    expect(selectedSlotId).toBe('content');
    expect(store.isRouteExpanded('admin', 'dashboard')).toBe(true);
    expect(store.isSlotExpanded('admin', 'dashboard', 'content')).toBe(true);
    expect(store.isRouteExpanded('admin', 'reports')).toBe(false);
  });
});

describe('sectionStore snapshot handling', () => {
  it('captures and restores selected section IDs', () => {
    const store = createSectionStore();
    const sections = [
      { id: 'alpha', label: 'Alpha' },
      { id: 'beta', label: 'Beta' },
      { id: 'gamma', label: 'Gamma' },
    ];

    store.setAvailableSections(sections);
    store.selectSections(['alpha', 'gamma']);

    const snapshot = store.takeSnapshot();
    expect(snapshot.sectionIds).toEqual(['alpha', 'gamma']);

    store.selectSections(['beta']);
    store.restoreSnapshot(snapshot as SectionSelectionSnapshot);

    expect(store.state.value.selectedSectionIds).toEqual(['alpha', 'gamma']);
  });

  it('filters out invalid section IDs during restore', () => {
    const store = createSectionStore();
    const sections = [
      { id: 'one', label: 'One' },
      { id: 'two', label: 'Two' },
    ];

    store.setAvailableSections(sections);
    const snapshot: SectionSelectionSnapshot = {
      sectionIds: ['two', 'missing'],
    };

    store.restoreSnapshot(snapshot);

    expect(store.state.value.selectedSectionIds).toEqual(['two']);
  });
});
