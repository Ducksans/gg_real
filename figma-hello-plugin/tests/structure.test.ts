import { beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(() => {
  const frameFactory = () =>
    ({
      type: 'FRAME' as const,
      name: 'Frame',
      children: [] as SceneNode[],
      layoutMode: 'VERTICAL' as AutoLayout,
      primaryAxisSizingMode: 'AUTO' as 'AUTO' | 'FIXED',
      counterAxisSizingMode: 'AUTO' as 'AUTO' | 'FIXED',
      itemSpacing: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      fills: [] as Paint[],
      strokes: [] as Paint[],
      layoutGrow: 0,
      height: 0,
      width: 0,
      x: 0,
      y: 0,
      appendChild(node: SceneNode) {
        this.children.push(node);
        (node as any).parent = this;
      },
      findOne() {
        return null;
      },
      resizeWithoutConstraints(width: number, height: number) {
        this.width = width;
        this.height = height;
      },
      setPluginData() {
        /* noop */
      },
      remove() {
        /* noop */
      },
    }) as unknown as FrameNode;

  const pageNode = {
    type: 'PAGE' as const,
    name: 'TestPage',
    children: [] as SceneNode[],
    appendChild(node: SceneNode) {
      this.children.push(node);
      (node as any).parent = this;
    },
    findOne() {
      return null;
    },
  } as unknown as PageNode;

  vi.stubGlobal('figma', {
    currentPage: pageNode,
    root: {
      findOne: () => null,
    },
    createFrame: frameFactory,
    notify: () => undefined,
    getLocalPaintStyles: () => [],
    getLocalTextStyles: () => [],
    ui: {
      postMessage: () => undefined,
    },
    mixed: Symbol('mixed'),
  } as unknown);
});

describe('runtime exports', () => {
  it('exposes executor entrypoints', async () => {
    const { runHelloFrame, runSchemaFromString, runSchemaBatch, runSchemaDocument } = await import(
      '@runtime'
    );
    expect(typeof runHelloFrame).toBe('function');
    expect(typeof runSchemaFromString).toBe('function');
    expect(typeof runSchemaBatch).toBe('function');
    expect(typeof runSchemaDocument).toBe('function');
  });

  it('exposes surface config helpers', async () => {
    const { resolveSurfaceConfig, computeSurfaceHash } = await import('@runtime/surface-config');
    expect(typeof resolveSurfaceConfig).toBe('function');
    expect(typeof computeSurfaceHash).toBe('function');
  });
});

describe('token registry scaffolding', () => {
  it('provides default token providers', async () => {
    const { figmaStyleProvider, figmaVariableProvider, remoteTokenProvider } = await import(
      '@token/providers'
    );
    expect(figmaStyleProvider.name).toBe('figma-style');
    expect(figmaVariableProvider.name).toBe('figma-variable');
    expect(remoteTokenProvider.name).toBe('remote-token');
  });

  it('exports token resolvers', async () => {
    const { resolveColorToken, resolveTypographyToken } = await import('@token/resolvers');
    expect(typeof resolveColorToken).toBe('function');
    expect(typeof resolveTypographyToken).toBe('function');
  });
});

describe('ui scaffolding', () => {
  it('exposes store factories', async () => {
    const { createExecutionStore, createLogStore } = await import('@ui/store');
    expect(typeof createExecutionStore).toBe('function');
    expect(typeof createLogStore).toBe('function');
  });

  it('exposes key UI components', async () => {
    const module = await import('@ui/components');
    const { ExecutionControls, ResultLog } = module as Record<string, unknown>;
    expect(typeof ExecutionControls).toBe('function');
    expect(typeof ResultLog).toBe('function');
  });
});
