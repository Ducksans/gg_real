import { createHelloFrame } from './lib/hello';
import { appendNodesFromSchema, BuildContext } from './lib/nodeFactory';
import { notifyError, notifySuccess, notifyWarning, sendDryRunResult } from './lib/notifier';
import {
  resolvePaintStyleId,
  resolvePaintToken,
  resolveRadiusToken,
  resolveTypographyToken,
} from './lib/tokenRegistry';
import { SchemaDocument, NodeOperation, NodeSpec, FrameNodeSpec } from './schema';
import { glossaryLayoutSample } from './samples/glossary';
import {
  archetypeManifest,
  ArchetypeSurface,
  ArchetypeSurfaceSlot,
  ArchetypeSlotSummary,
} from './lib/archetype-manifest';

const tokenResolver = (token: string) => resolvePaintToken(token);

const DEFAULT_SURFACE_ID = 'plugin';
const PLUGINDATA_KEYS = {
  surfaceId: '__auto_surfaceId',
  surfaceHash: '__auto_surfaceHash',
  slotId: '__auto_slotId',
  slotHash: '__auto_slotHash',
  nodeKey: '__auto_nodeKey',
};

interface RuntimeSurfaceSlot extends ArchetypeSurfaceSlot {
  layout?: 'VERTICAL' | 'HORIZONTAL';
  spacing?: number;
  padding: BoxSpacing;
  width?: number | 'hug' | 'fill';
  height?: number | 'hug';
  grow?: number;
  allowedSections: string[];
}

interface RuntimeSurfaceConfig {
  id: string;
  label: string;
  width: number;
  height?: number | null;
  padding: BoxSpacing;
  spacing: number;
  background?: string | null;
  slots: Record<string, RuntimeSurfaceSlot>;
  routes: Record<string, { label: string; slots: Record<string, ArchetypeSlotSummary> }>;
  requiredSlots: string[];
}

const SURFACE_CONFIGS: Record<string, RuntimeSurfaceConfig> = buildSurfaceConfigs();

function buildSurfaceConfigs(): Record<string, RuntimeSurfaceConfig> {
  const map: Record<string, RuntimeSurfaceConfig> = {};
  Object.entries(archetypeManifest.surfaces).forEach(([key, surface]) => {
    const converted = convertSurface(surface);
    map[converted.id] = converted;
  });
  if (!map[DEFAULT_SURFACE_ID]) {
    if (Object.keys(map).length) {
      const firstKey = Object.keys(map)[0];
      map[DEFAULT_SURFACE_ID] = map[firstKey];
    } else {
      map[DEFAULT_SURFACE_ID] = FALLBACK_SURFACE;
    }
  }
  return map;
}

function convertSurface(surface: ArchetypeSurface): RuntimeSurfaceConfig {
  const normalizedId = surface.id.toLowerCase();
  const slots: Record<string, RuntimeSurfaceSlot> = {};
  Object.entries(surface.slots).forEach(([slotId, slot]) => {
    const normalizedSlotId = slotId.toLowerCase();
    const allowed = Array.isArray(slot.allowedSections)
      ? Array.from(new Set(slot.allowedSections))
      : [];
    slots[normalizedSlotId] = {
      id: normalizedSlotId,
      label: slot.label ?? titleCase(normalizedSlotId),
      parent: slot.parent ? slot.parent.toLowerCase() : null,
      layout: slot.layout,
      spacing: typeof slot.spacing === 'number' ? slot.spacing : undefined,
      padding: normalizePadding(slot.padding),
      width: slot.width,
      height: slot.height,
      grow: typeof slot.grow === 'number' ? slot.grow : undefined,
      allowedSections: allowed,
    };
  });

  const routes: Record<string, { label: string; slots: Record<string, ArchetypeSlotSummary> }> = {};
  Object.entries(surface.routes ?? {}).forEach(([routeId, route]) => {
    const normalizedRouteId = routeId.toLowerCase();
    const slotSummaries: Record<string, ArchetypeSlotSummary> = {};
    Object.entries(route.slots ?? {}).forEach(([slotKey, slotValue]) => {
      const normalizedSlotKey = slotKey.toLowerCase();
      slotSummaries[normalizedSlotKey] = {
        label: slotValue.label,
        sections: Array.isArray(slotValue.sections) ? slotValue.sections : [],
      };
    });
    routes[normalizedRouteId] = {
      label: route.label,
      slots: slotSummaries,
    };
  });

  return {
    id: normalizedId,
    label: surface.label,
    width: surface.layout.width,
    height: surface.layout.height ?? null,
    padding: normalizePadding(surface.layout.padding),
    spacing: surface.layout.spacing ?? 0,
    background: surface.layout.background ?? null,
    slots,
    routes,
    requiredSlots: Array.isArray(surface.requiredSlots)
      ? surface.requiredSlots.map((slot) => slot.toLowerCase())
      : [],
  };
}

function computeSurfaceHash(surface: RuntimeSurfaceConfig): string {
  return stableHash(
    JSON.stringify({
      width: surface.width,
      height: surface.height,
      padding: surface.padding,
      spacing: surface.spacing,
    }),
  );
}

function computeSlotHash(surface: RuntimeSurfaceConfig, slotId: string | null): string {
  if (!slotId) return '';
  const slot = surface.slots[slotId];
  if (!slot) return '';
  return stableHash(
    JSON.stringify({
      parent: slot.parent,
      layout: slot.layout,
      spacing: slot.spacing,
      padding: slot.padding,
      width: slot.width,
      height: slot.height,
      grow: slot.grow,
    }),
  );
}

function computeNodeKey(surfaceId: string, slotId: string, seed: string): string {
  return stableHash(`${surfaceId}|${slotId}|${seed}`);
}

function stableHash(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return `h${(hash >>> 0).toString(16)}`;
}

function normalizePadding(padding?: BoxSpacing | null): BoxSpacing {
  if (!padding) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  const { top = 0, right = 0, bottom = 0, left = 0 } = padding;
  return { top, right, bottom, left };
}

export const SAMPLE_SCHEMA = glossaryLayoutSample;

export async function runHelloFrame() {
  const frame = await createHelloFrame();
  notifySuccess(`프레임 '${frame.name}' 생성 완료`);
}

export async function runSchemaFromString(
  raw: string,
  options?: {
    targetPage?: string;
    targetMode?: 'append' | 'replace' | 'update';
    intent?: 'dry-run' | 'apply';
  },
) {
  if (!raw.trim()) {
    throw new Error('JSON 스키마가 비어 있습니다.');
  }

  let doc: SchemaDocument;
  try {
    doc = JSON.parse(raw) as SchemaDocument;
  } catch (error) {
    const parseError = new Error('JSON 파싱에 실패했습니다. 형식을 확인해 주세요.');
    notifyError(parseError, parseError.message);
    throw parseError;
  }

  const guard = evaluateGuardrails(doc, raw.length);
  if (guard.errors.length) {
    const message = guard.errors.join('\n');
    const guardError = new Error(message);
    notifyError(guardError, message);
    sendDryRunResult({
      page: doc.target?.page ?? figma.currentPage.name,
      frameName: doc.target?.frameName ?? 'GeneratedFrame',
      sections: doc.meta?.section ? [doc.meta.section] : [],
      metrics: { created: 0, warnings: guard.warnings.length, errors: guard.errors.length },
      warnings: guard.warnings,
      errors: guard.errors,
    });
    throw guardError;
  }
  guard.warnings.forEach((warn) => notifyWarning(warn));

  await runSchemaDocument(doc, options, guard);
}

export async function runSchemaBatch(
  raws: string[],
  options?: {
    targetPage?: string;
    targetMode?: 'append' | 'replace' | 'update';
    intent?: 'dry-run' | 'apply';
  },
) {
  if (!raws.length) {
    throw new Error('선택된 섹션이 없습니다.');
  }

  const parsed = raws.map((raw) => {
    let doc: SchemaDocument;
    try {
      doc = JSON.parse(raw) as SchemaDocument;
    } catch (error) {
      throw new Error('JSON 파싱에 실패했습니다. 형식을 확인해 주세요.');
    }
    const guard = evaluateGuardrails(doc, raw.length);
    return { raw, doc, guard };
  });

  const errorMessages: string[] = [];
  const warningSet = new Set<string>();
  parsed.forEach(({ doc, guard }) => {
    if (guard.errors.length) {
      const prefix = doc.meta?.section ? `${doc.meta.section}: ` : '';
      guard.errors.forEach((err) => errorMessages.push(`${prefix}${err}`));
    }
    guard.warnings.forEach((warn) => warningSet.add(warn));
  });

  if (errorMessages.length) {
    const message = errorMessages.join('\n');
    notifyError(new Error(message), message);
    throw new Error(message);
  }

  const firstDoc = parsed[0].doc;
  const surface = getSurfaceConfig(firstDoc.meta);
  const normalized = normalizeTarget(firstDoc, options?.targetPage, options?.targetMode);
  const page = findTargetPage(normalized.page);
  const isPreview = options?.intent === 'dry-run';
  if (isPreview && !normalized.frameName.endsWith('_preview')) {
    normalized.frameName = `${normalized.frameName}_preview`;
    firstDoc.target = firstDoc.target ?? { frameName: normalized.frameName, mode: 'append' };
    firstDoc.target.frameName = normalized.frameName;
  }
  if (options?.targetMode === 'replace' || isPreview) {
    removeExistingFrame(page, normalized.frameName);
  }
  const effectiveMode: 'append' | 'replace' | 'update' =
    options?.targetMode === 'replace' || isPreview ? 'append' : normalized.mode;
  const container = prepareTargetFrame(page, normalized, surface);
  applySurfaceLayout(container, surface);

  const createdNodes: SceneNode[] = [];
  const executedSections: string[] = [];
  const usedSlots = new Set<string>();

  for (const entry of parsed) {
    const doc = entry.doc;
    const existingTarget = doc.target ?? {
      frameName: normalized.frameName,
      mode: normalized.mode,
    };
    const targetOverride = {
      frameName: normalized.frameName,
      page: normalized.page,
      mode: effectiveMode,
    };
    doc.target = Object.assign({}, existingTarget, targetOverride);

    const slotId = normalizeSlotName(doc.meta?.slot);
    if (slotId) {
      usedSlots.add(slotId);
    }
    const nodes = await runSchemaDocument(
      doc,
      {
        targetPage: normalized.page,
        silent: true,
        targetMode: isPreview ? 'replace' : targetOverride.mode,
        intent: options?.intent,
      },
      entry.guard,
      container,
      surface,
      slotId,
    );
    entry.guard.warnings.forEach((warn) => warningSet.add(warn));
    nodes.forEach((node) => createdNodes.push(node));
    if (doc.meta?.section) {
      executedSections.push(doc.meta.section);
    }
  }

  figma.currentPage = page;
  if (createdNodes.length) {
    figma.currentPage.selection = createdNodes;
  } else {
    figma.currentPage.selection = [];
  }

  const intentMessage = options?.intent === 'apply' ? '적용' : 'Dry-run';
  const message = `${executedSections.length}개 섹션 ${intentMessage} 완료`;
  notifySuccess(message);
  surface.requiredSlots
    .filter((slot) => !usedSlots.has(slot))
    .forEach((slot) => {
      const slotName = surface.slots[slot]?.name ?? slot;
      warningSet.add(`${slotName} 슬롯에 할당된 섹션이 없습니다.`);
    });
  const warningMessages = Array.from(warningSet);
  sendDryRunResult({
    page: normalized.page,
    frameName: normalized.frameName,
    sections: executedSections,
    metrics: {
      created: createdNodes.length,
      warnings: warningMessages.length,
      errors: 0,
    },
    warnings: warningMessages,
    errors: [],
  });
}

export async function runSchemaDocument(
  doc: SchemaDocument,
  options?: {
    targetPage?: string;
    silent?: boolean;
    targetMode?: 'append' | 'replace' | 'update';
    intent?: 'dry-run' | 'apply';
  },
  guardInfo?: { warnings: string[]; errors: string[] },
  containerOverride?: FrameNode,
  surfaceOverride?: SurfaceConfig,
  slotOverride?: string | null,
) {
  const surface = surfaceOverride ?? getSurfaceConfig(doc.meta);
  const isPreview = options?.intent === 'dry-run';
  const normalized = normalizeTarget(doc, options?.targetPage, options?.targetMode);
  if (isPreview && !normalized.frameName.endsWith('_preview')) {
    normalized.frameName = `${normalized.frameName}_preview`;
    doc.target = doc.target ?? { frameName: normalized.frameName, mode: 'append' };
    doc.target.frameName = normalized.frameName;
  }
  const page = findTargetPage(normalized.page);

  if (!doc.nodes || doc.nodes.length === 0) {
    throw new Error('nodes 배열이 비어 있어 실행할 수 없습니다.');
  }

  if (!containerOverride && (options?.targetMode === 'replace' || isPreview)) {
    removeExistingFrame(page, normalized.frameName);
  }
  const baseContainer = containerOverride ?? prepareTargetFrame(page, normalized, surface);
  if (!containerOverride) {
    applySurfaceLayout(baseContainer, surface);
  }
  const guard = guardInfo ?? { warnings: [], errors: [] };

  const slotId = slotOverride ?? normalizeSlotName(doc.meta?.slot);
  if (slotId && !surface.slots[slotId]) {
    guard.warnings.push(
      `${surface.label}에서 지원하지 않는 슬롯 '${slotId}' 입니다. 루트 컨테이너에 배치했습니다.`,
    );
  }
  const slotTarget = resolveSlotContainer(baseContainer, slotId, surface);

  const nodes = await syncSlotChildren(
    slotTarget,
    doc.nodes,
    {
      tokenResolver,
      paintStyleResolver: resolvePaintStyleId,
      radiusResolver: resolveRadiusToken,
      typographyResolver: resolveTypographyToken,
    },
    surface,
    slotId,
    isPreview ? 'replace' : options?.targetMode === 'replace' ? 'replace' : 'append',
  );
  if (!options?.silent) {
    figma.currentPage = page;
    if (nodes.length) {
      figma.currentPage.selection = nodes;
    } else {
      figma.currentPage.selection = [];
    }

    const message = doc.meta?.title ?? `${nodes.length}개 요소 생성 완료`;
    notifySuccess(message);
    sendDryRunResult({
      page: normalized.page,
      frameName: normalized.frameName,
      sections: doc.meta?.section ? [doc.meta.section] : [],
      metrics: { created: nodes.length, warnings: guard.warnings.length, errors: 0 },
      warnings: guard.warnings,
      errors: [],
    });
  }

  return nodes;
}

function normalizeTarget(
  doc: SchemaDocument,
  overridePage?: string,
  overrideMode?: 'append' | 'replace' | 'update',
): Required<SchemaDocument['target']> {
  const defaultPage = overridePage?.trim() || doc.target?.page?.trim() || figma.currentPage.name;
  const defaultFrame = doc.target?.frameName?.trim() || doc.meta?.title || 'GeneratedFrame';
  const defaultMode = overrideMode ?? doc.target?.mode ?? 'append';

  const normalized = {
    page: defaultPage,
    frameName: defaultFrame,
    mode: defaultMode,
  } as Required<SchemaDocument['target']>;

  doc.target = normalized;
  return normalized;
}

function findTargetPage(pageName: string): PageNode {
  const match = figma.root.findOne(
    (node) => node.type === 'PAGE' && node.name === pageName,
  ) as PageNode | null;

  if (match) return match;
  throw new Error(`페이지 '${pageName}'을(를) 찾을 수 없습니다.`);
}

function removeExistingFrame(page: PageNode, frameName: string) {
  const existing = page.findOne((node) => node.type === 'FRAME' && node.name === frameName);
  existing?.remove();
}

function prepareTargetFrame(
  page: PageNode,
  target: Required<SchemaDocument['target']>,
  surface?: RuntimeSurfaceConfig,
): FrameNode {
  let frame = page.findOne(
    (node) => node.type === 'FRAME' && node.name === target.frameName,
  ) as FrameNode | null;

  if (frame && target.mode === 'replace') {
    frame.remove();
    frame = null;
  }

  if (!frame) {
    frame = figma.createFrame();
    frame.name = target.frameName;
    frame.layoutMode = 'VERTICAL';
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'AUTO';
    frame.itemSpacing = 16;
    frame.paddingTop = 24;
    frame.paddingRight = 24;
    frame.paddingBottom = 24;
    frame.paddingLeft = 24;
    frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    frame.strokeWeight = 0;
    const targetWidth = surface?.width ?? FALLBACK_SURFACE.width;
    const targetHeight = surface?.height ?? 10;
    frame.resizeWithoutConstraints(targetWidth, targetHeight);

    const nextY = calculateNextY(page);
    frame.x = 0;
    frame.y = nextY;

    page.appendChild(frame);
  } else {
    ensureAutoLayout(frame);
  }

  return frame;
}

interface BoxSpacing {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

const FALLBACK_SURFACE: RuntimeSurfaceConfig = {
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
    'surface-tabs': {
      id: 'surface-tabs',
      label: 'Surface Tabs',
      parent: 'nav',
      layout: 'HORIZONTAL',
      spacing: 8,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      allowedSections: [],
    },
    tree: {
      id: 'tree',
      label: 'Section Tree',
      parent: 'nav',
      layout: 'VERTICAL',
      spacing: 12,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      grow: 1,
      allowedSections: [],
    },
    detail: {
      id: 'detail',
      label: 'Detail Panel',
      parent: 'body',
      layout: 'VERTICAL',
      spacing: 16,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      grow: 1,
      allowedSections: [],
    },
    log: {
      id: 'log',
      label: 'Execution Panel',
      parent: 'body',
      layout: 'VERTICAL',
      spacing: 12,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      width: 240,
      allowedSections: [],
    },
    footer: {
      id: 'footer',
      label: 'Footer Actions',
      parent: null,
      layout: 'VERTICAL',
      spacing: 12,
      padding: { top: 16, right: 0, bottom: 0, left: 0 },
      allowedSections: [],
    },
  },
  routes: {},
  requiredSlots: ['header', 'surface-tabs', 'tree', 'detail', 'log'],
};

function getSurfaceConfig(meta?: SchemaDocument['meta']): RuntimeSurfaceConfig {
  const key = meta?.designSurface?.toLowerCase();
  if (key && SURFACE_CONFIGS[key]) {
    return SURFACE_CONFIGS[key];
  }
  if (SURFACE_CONFIGS[DEFAULT_SURFACE_ID]) {
    return SURFACE_CONFIGS[DEFAULT_SURFACE_ID];
  }
  return FALLBACK_SURFACE;
}

function normalizeSlotName(slot?: string | null): string | null {
  if (!slot) return null;
  const normalized = slot.trim().toLowerCase();
  return normalized.length ? normalized : null;
}

function resolveSlotContainer(
  root: FrameNode,
  slotId: string | null,
  surface: RuntimeSurfaceConfig,
): FrameNode {
  if (!slotId) return root;
  if (!surface.slots[slotId]) {
    return root;
  }
  return ensureSlotContainer(root, slotId, surface);
}

function ensureSlotContainer(
  root: FrameNode,
  slotId: string,
  surface: RuntimeSurfaceConfig,
): FrameNode {
  const config = surface.slots[slotId];
  if (!config) return root;

  let parent: FrameNode = root;
  if (config.parent) {
    parent = ensureSlotContainer(root, config.parent, surface);
  }

  const slotName = `Slot:${surface.id}:${slotId}`;
  const existing = parent.findOne((node) => node.type === 'FRAME' && node.name === slotName);
  if (existing) {
    applySlotLayout(existing as FrameNode, config, surface, slotId);
    return existing as FrameNode;
  }

  const frame = figma.createFrame();
  frame.name = slotName;
  applySlotLayout(frame, config, surface, slotId);
  parent.appendChild(frame);
  return frame;
}

function applySlotLayout(
  frame: FrameNode,
  config: RuntimeSurfaceSlot,
  surface: RuntimeSurfaceConfig,
  slotId: string,
) {
  frame.layoutMode = config.layout === 'HORIZONTAL' ? 'HORIZONTAL' : 'VERTICAL';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';
  frame.itemSpacing = config.spacing ?? (frame.layoutMode === 'HORIZONTAL' ? 16 : 12);

  const padding = config.padding ?? {};
  frame.paddingTop = padding.top ?? 0;
  frame.paddingRight = padding.right ?? 0;
  frame.paddingBottom = padding.bottom ?? 0;
  frame.paddingLeft = padding.left ?? 0;

  frame.strokes = [];
  frame.fills = [];

  frame.layoutGrow =
    typeof config.grow === 'number' ? config.grow : config.width === 'fill' ? 1 : 0;

  if (config.width && config.width !== 'hug') {
    if (config.width === 'fill') {
      frame.primaryAxisSizingMode = 'AUTO';
      frame.layoutGrow = config.grow ?? 1;
    } else if (typeof config.width === 'number') {
      frame.primaryAxisSizingMode = 'FIXED';
      frame.resizeWithoutConstraints(config.width, Math.max(frame.height, 10));
    }
  } else if (frame.layoutMode === 'VERTICAL') {
    frame.counterAxisSizingMode = 'AUTO';
  }

  if (config.height && config.height !== 'hug') {
    if (typeof config.height === 'number') {
      frame.counterAxisSizingMode = 'FIXED';
      frame.resizeWithoutConstraints(Math.max(frame.width, 10), config.height);
    }
  }

  const surfaceHash = computeSurfaceHash(surface);
  const slotHash = computeSlotHash(surface, slotId);
  frame.setPluginData(PLUGINDATA_KEYS.surfaceId, surface.id);
  frame.setPluginData(PLUGINDATA_KEYS.surfaceHash, surfaceHash);
  frame.setPluginData(PLUGINDATA_KEYS.slotId, slotId);
  frame.setPluginData(PLUGINDATA_KEYS.slotHash, slotHash);
}

function applySurfaceLayout(root: FrameNode, surface: RuntimeSurfaceConfig) {
  root.layoutMode = 'VERTICAL';
  const surfaceHash = computeSurfaceHash(surface);

  const hasFixedHeight = surface.height !== null && typeof surface.height === 'number';
  root.primaryAxisSizingMode = hasFixedHeight ? 'FIXED' : 'AUTO';
  root.counterAxisSizingMode = 'FIXED';
  root.resizeWithoutConstraints(
    surface.width,
    hasFixedHeight ? surface.height : Math.max(root.height, 10),
  );
  root.itemSpacing = surface.spacing;

  const padding = surface.padding ?? {};
  root.paddingTop = padding.top ?? 0;
  root.paddingRight = padding.right ?? 0;
  root.paddingBottom = padding.bottom ?? 0;
  root.paddingLeft = padding.left ?? 0;

  root.strokes = [];
  const backgroundPaint = surface.background ? resolvePaintToken(surface.background) : null;
  if (backgroundPaint) {
    root.fills = [backgroundPaint];
  } else if (root.fills === figma.mixed || root.fills.length === 0) {
    root.fills = [{ type: 'SOLID', color: { r: 0.953, g: 0.957, b: 0.965 } }];
  }

  root.setPluginData(PLUGINDATA_KEYS.surfaceId, surface.id);
  root.setPluginData(PLUGINDATA_KEYS.surfaceHash, surfaceHash);
  root.setPluginData(PLUGINDATA_KEYS.slotId, '');
  root.setPluginData(PLUGINDATA_KEYS.slotHash, surfaceHash);
}

async function syncSlotChildren(
  slotFrame: FrameNode,
  specs: NodeSpec[],
  ctx: BuildContext,
  surface: RuntimeSurfaceConfig,
  slotId: string | null,
  mode: 'append' | 'replace' | 'update' = 'append',
): Promise<SceneNode[]> {
  if (!specs?.length) {
    return [];
  }

  const normalizedSlotId = slotId ?? '';
  const surfaceHash = computeSurfaceHash(surface);
  const slotHash = computeSlotHash(surface, normalizedSlotId);

  if (mode === 'replace') {
    // Remove existing children before re-creating nodes for this slot.
    Array.from(slotFrame.children).forEach((child) => child.remove());
  }

  const existingMap = new Map<string, SceneNode>();
  slotFrame.children.forEach((child) => {
    const key = child.getPluginData(PLUGINDATA_KEYS.nodeKey);
    if (key) {
      existingMap.set(key, child);
    }
  });

  const toCreate: NodeSpec[] = [];

  specs.forEach((spec) => {
    const op: NodeOperation = spec.operation ?? 'add';
    const idKey = spec.idempotentKey || spec.name;
    const nodeKey = computeNodeKey(surface.id, normalizedSlotId, idKey);

    if (op === 'remove') {
      const existing = existingMap.get(nodeKey);
      if (existing) {
        existing.remove();
        existingMap.delete(nodeKey);
      }
      return;
    }

    if (op === 'update' || op === 'add') {
      const existing = existingMap.get(nodeKey);
      if (existing) {
        existing.remove();
        existingMap.delete(nodeKey);
      }

      decorateSpecWithMetadata(spec, surface, normalizedSlotId, surfaceHash, slotHash, nodeKey);
      toCreate.push(spec);
    }
  });

  if (!toCreate.length) {
    return [];
  }

  return appendNodesFromSchema(slotFrame, toCreate, ctx);
}

function decorateSpecWithMetadata(
  spec: NodeSpec,
  surface: RuntimeSurfaceConfig,
  slotId: string,
  surfaceHash: string,
  slotHash: string,
  nodeKey?: string,
) {
  const baseData = spec.pluginData ? Object.assign({}, spec.pluginData) : {};
  baseData[PLUGINDATA_KEYS.surfaceId] = surface.id;
  baseData[PLUGINDATA_KEYS.surfaceHash] = surfaceHash;
  baseData[PLUGINDATA_KEYS.slotId] = slotId;
  baseData[PLUGINDATA_KEYS.slotHash] = slotHash;
  if (nodeKey) {
    baseData[PLUGINDATA_KEYS.nodeKey] = nodeKey;
  }
  spec.pluginData = baseData;

  if (
    'children' in spec &&
    Array.isArray((spec as FrameNodeSpec | { children?: NodeSpec[] }).children)
  ) {
    ((spec as FrameNodeSpec).children ?? []).forEach((child) => {
      decorateSpecWithMetadata(child, surface, slotId, surfaceHash, slotHash);
    });
  }
}

function calculateNextY(page: PageNode): number {
  if (page.children.length === 0) return 0;
  let maxBottom = 0;
  page.children.forEach((child) => {
    const bottom = child.y + child.height;
    if (bottom > maxBottom) {
      maxBottom = bottom;
    }
  });
  return maxBottom + 40;
}

function ensureAutoLayout(frame: FrameNode) {
  frame.layoutMode = 'VERTICAL';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';
  frame.itemSpacing = frame.itemSpacing || 32;
  frame.paddingTop = frame.paddingTop || 32;
  frame.paddingRight = frame.paddingRight || 32;
  frame.paddingBottom = frame.paddingBottom || 32;
  frame.paddingLeft = frame.paddingLeft || 32;
  if (frame.fills === figma.mixed || frame.fills.length === 0) {
    frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  }
}

const GUARD_THRESHOLDS = {
  warn: {
    nodeCount: 120,
    depth: 6,
    fileSize: 40 * 1024,
  },
  fail: {
    nodeCount: 200,
    depth: 8,
    fileSize: 80 * 1024,
  },
};

function evaluateGuardrails(doc: SchemaDocument, rawLength: number) {
  const warnings: string[] = [];
  const errors: string[] = [];

  const { count, maxDepth } = countNodes(doc.nodes ?? []);

  if (count >= GUARD_THRESHOLDS.fail.nodeCount) {
    errors.push(`노드 수(${count})가 허용치를 초과했습니다. 섹션을 분할하세요.`);
  } else if (count >= GUARD_THRESHOLDS.warn.nodeCount) {
    warnings.push(`노드 수가 많습니다(${count}). 섹션 분할을 고려하세요.`);
  }

  if (maxDepth >= GUARD_THRESHOLDS.fail.depth) {
    errors.push(`중첩 수준(${maxDepth})이 너무 깊습니다. 레이아웃을 단순화하세요.`);
  } else if (maxDepth >= GUARD_THRESHOLDS.warn.depth) {
    warnings.push(`중첩 수준이 높습니다(${maxDepth}). 구조를 점검하세요.`);
  }

  if (rawLength >= GUARD_THRESHOLDS.fail.fileSize) {
    errors.push(`JSON 크기(${Math.round(rawLength / 1024)}KB)가 허용치를 초과했습니다.`);
  } else if (rawLength >= GUARD_THRESHOLDS.warn.fileSize) {
    warnings.push(`JSON 크기가 큽니다(${Math.round(rawLength / 1024)}KB).`);
  }

  const surface = getSurfaceConfig(doc.meta);
  const slotId = normalizeSlotName(doc.meta?.slot);
  if (slotId) {
    if (!surface.slots[slotId]) {
      warnings.push(`슬롯 '${slotId}'는 ${surface.label} Surface에 정의되어 있지 않습니다.`);
    } else if (
      surface.slots[slotId].allowedSections.length &&
      doc.meta?.section &&
      !surface.slots[slotId].allowedSections.includes(doc.meta.section)
    ) {
      warnings.push(
        `${doc.meta.section} 섹션은 ${surface.slots[slotId].label} 슬롯에 허용되지 않습니다.`,
      );
    }
  }

  return { warnings, errors };
}

function countNodes(nodes: NodeSpec[], depth = 1): { count: number; maxDepth: number } {
  let count = 0;
  let maxDepth = depth;

  for (const node of nodes) {
    count += 1;
    if ('children' in node && node.children?.length) {
      const child = countNodes(node.children, depth + 1);
      count += child.count;
      if (child.maxDepth > maxDepth) {
        maxDepth = child.maxDepth;
      }
    }
  }

  return { count, maxDepth };
}
