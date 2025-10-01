import { beforeAll, describe, expect, it } from 'vitest';

import type { SchemaDocument } from '@schema/index';
import { normalizeTarget } from '@runtime/executor/context-factory';
import { decorateWithMetadata } from '@runtime/slot-manager/metadata';
import { PLUGINDATA_KEYS } from '@runtime/utils';
import type { SurfaceConfig } from '@runtime/surface-config/types';

beforeAll(() => {
  (globalThis as any).figma = {
    currentPage: {
      name: 'DefaultPage',
    },
  } satisfies Partial<typeof figma>;
});

describe('executor context helpers', () => {
  it('normalizes target values using overrides and defaults', () => {
    const doc: SchemaDocument = {
      schemaVersion: '1.0.0',
      target: {
        frameName: 'OriginalFrame',
        mode: 'append',
      },
      nodes: [],
    };

    const target = normalizeTarget(doc, undefined, 'replace');
    expect(target.page).toBe('DefaultPage');
    expect(target.frameName).toBe('OriginalFrame');
    expect(target.mode).toBe('replace');
  });
});

describe('slot manager metadata decorator', () => {
  const surface: SurfaceConfig = {
    id: 'plugin',
    label: 'Plugin',
    width: 900,
    height: null,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    spacing: 0,
    background: null,
    requiredSlots: [],
    slots: {
      main: {
        id: 'main',
        label: 'Main',
        parent: null,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        allowedSections: [],
      },
    },
    routes: {},
  };

  it('applies metadata recursively to child nodes', () => {
    const spec = {
      type: 'frame',
      name: 'parent',
      children: [
        {
          type: 'text',
          name: 'child',
        },
      ],
    } as any;

    decorateWithMetadata(spec, surface, 'main', 'surface-hash', 'slot-hash', 'node-key');

    expect(spec.pluginData[PLUGINDATA_KEYS.surfaceId]).toBe('plugin');
    expect(spec.pluginData[PLUGINDATA_KEYS.slotId]).toBe('main');
    expect(spec.pluginData[PLUGINDATA_KEYS.nodeKey]).toBe('node-key');
    const childPluginData = spec.children?.[0]?.pluginData ?? {};
    expect(childPluginData[PLUGINDATA_KEYS.surfaceId]).toBe('plugin');
    expect(childPluginData[PLUGINDATA_KEYS.slotId]).toBe('main');
  });
});
