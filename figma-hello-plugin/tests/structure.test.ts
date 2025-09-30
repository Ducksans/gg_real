import { describe, it, expect } from 'vitest';

import {
  runDryRunStrategy,
  runApplyStrategy,
  runPreviewStrategy,
} from '@runtime/slot-manager/strategies';
import {
  writeAuditMetadata,
  captureSlotSnapshot,
  formatSlotDiff,
} from '@runtime/slot-manager/auditor';
import { runtimeExecutionPipeline } from '@runtime/executor';
import { figmaStyleProvider, figmaVariableProvider, remoteTokenProvider } from '@token/providers';
import { resolveColorToken, resolveTypographyToken } from '@token/resolvers';
import { renderSurfaceTabs, renderResultLog, renderPreviewControls } from '@ui/components';
import { createSurfaceStore, createExecutionStore } from '@ui/store';

const fnType = 'function';

describe('runtime scaffolding', () => {
  it('exposes slot manager strategies', () => {
    expect(typeof runDryRunStrategy).toBe(fnType);
    expect(typeof runApplyStrategy).toBe(fnType);
    expect(typeof runPreviewStrategy).toBe(fnType);
  });

  it('exposes slot manager auditor helpers', () => {
    expect(typeof writeAuditMetadata).toBe(fnType);
    expect(typeof captureSlotSnapshot).toBe(fnType);
    expect(typeof formatSlotDiff).toBe(fnType);
  });

  it('defines execution pipeline ordering', () => {
    expect(runtimeExecutionPipeline).toEqual(['guardrails', 'slot-manager', 'notifier']);
  });
});

describe('token registry scaffolding', () => {
  it('provides default token providers', () => {
    expect(figmaStyleProvider.name).toBe('figma-style');
    expect(figmaVariableProvider.name).toBe('figma-variable');
    expect(remoteTokenProvider.name).toBe('remote-token');
  });

  it('exports token resolvers', () => {
    expect(typeof resolveColorToken).toBe(fnType);
    expect(typeof resolveTypographyToken).toBe(fnType);
  });
});

describe('ui scaffolding', () => {
  it('exposes store factories', () => {
    expect(typeof createSurfaceStore).toBe(fnType);
    expect(typeof createExecutionStore).toBe(fnType);
  });

  it('exposes key UI components', () => {
    expect(typeof renderSurfaceTabs).toBe(fnType);
    expect(typeof renderResultLog).toBe(fnType);
    expect(typeof renderPreviewControls).toBe(fnType);
  });
});
