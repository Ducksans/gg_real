import { createHelloFrame } from './lib/hello';
import { appendNodesFromSchema } from './lib/nodeFactory';
import { notifyError, notifySuccess, notifyWarning, sendDryRunResult } from './lib/notifier';
import {
  resolvePaintStyleId,
  resolvePaintToken,
  resolveRadiusToken,
  resolveTypographyToken,
} from './lib/tokenRegistry';
import { SchemaDocument } from './schema';
import { glossaryLayoutSample } from './samples/glossary';

const tokenResolver = (token: string) => resolvePaintToken(token);

export const SAMPLE_SCHEMA = glossaryLayoutSample;

export async function runHelloFrame() {
  const frame = await createHelloFrame();
  notifySuccess(`프레임 '${frame.name}' 생성 완료`);
}

export async function runSchemaFromString(
  raw: string,
  options?: {
    targetPage?: string;
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
  const normalized = normalizeTarget(firstDoc, options?.targetPage);
  const page = findTargetPage(normalized.page);
  const container = prepareTargetFrame(page, normalized);
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
      mode: existingTarget.mode ?? normalized.mode,
    };
    doc.target = Object.assign({}, existingTarget, targetOverride);

    const slotId = normalizeSlotName(doc.meta?.slot);
    if (slotId) {
      usedSlots.add(slotId);
    }
    const nodes = await runSchemaDocument(
      doc,
      { targetPage: normalized.page, silent: true },
      entry.guard,
      container,
      surface,
      slotId,
    );
    entry.guard.warnings.forEach((warn) => warningSet.add(warn));
    createdNodes.push(...nodes);
    if (doc.meta?.section) {
      executedSections.push(doc.meta.section);
    }
  }

  figma.currentPage = page;
  if (createdNodes.length) {
    figma.currentPage.selection = createdNodes;
  }

  const message = `${executedSections.length}개 섹션 적용 완료`;
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
  },
  guardInfo?: { warnings: string[]; errors: string[] },
  containerOverride?: FrameNode,
  surfaceOverride?: SurfaceConfig,
  slotOverride?: string | null,
) {
  const surface = surfaceOverride ?? getSurfaceConfig(doc.meta);
  const normalized = normalizeTarget(doc, options?.targetPage);
  const page = findTargetPage(normalized.page);

  if (!doc.nodes || doc.nodes.length === 0) {
    throw new Error('nodes 배열이 비어 있어 실행할 수 없습니다.');
  }

  const baseContainer = containerOverride ?? prepareTargetFrame(page, normalized);
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

  const nodes = await appendNodesFromSchema(slotTarget, doc.nodes, {
    tokenResolver,
    paintStyleResolver: resolvePaintStyleId,
    radiusResolver: resolveRadiusToken,
    typographyResolver: resolveTypographyToken,
  });
  if (!options?.silent) {
    figma.currentPage = page;
    figma.currentPage.selection = nodes;

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
): Required<SchemaDocument['target']> {
  const defaultPage = overridePage?.trim() || doc.target?.page?.trim() || figma.currentPage.name;
  const defaultFrame = doc.target?.frameName?.trim() || doc.meta?.title || 'GeneratedFrame';
  const defaultMode = doc.target?.mode ?? 'append';

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

function prepareTargetFrame(page: PageNode, target: Required<SchemaDocument['target']>): FrameNode {
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
    frame.resizeWithoutConstraints(440, 10);

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

interface SlotConfig {
  parent: string | null;
  layout?: 'VERTICAL' | 'HORIZONTAL';
  spacing?: number;
  padding?: BoxSpacing;
  width?: number | 'hug';
  height?: number | 'hug';
  grow?: number;
  name?: string;
}

interface SurfaceConfig {
  id: string;
  label: string;
  width: number;
  padding: BoxSpacing;
  spacing: number;
  slots: Record<string, SlotConfig>;
  requiredSlots: string[];
}

const SURFACE_CONFIGS: Record<string, SurfaceConfig> = {
  plugin: {
    id: 'plugin',
    label: 'Plugin UI',
    width: 440,
    padding: { top: 24, right: 24, bottom: 24, left: 24 },
    spacing: 16,
    slots: {
      header: {
        parent: null,
        layout: 'HORIZONTAL',
        spacing: 16,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        name: 'Header',
      },
      'surface-tabs': {
        parent: null,
        layout: 'HORIZONTAL',
        spacing: 8,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        name: 'Surface Tabs',
      },
      body: {
        parent: null,
        layout: 'HORIZONTAL',
        spacing: 16,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        name: 'Body',
      },
      tree: {
        parent: 'body',
        width: 160,
        padding: { top: 0, right: 16, bottom: 0, left: 0 },
        name: 'Navigation Tree',
      },
      detail: {
        parent: 'body',
        width: 'hug',
        grow: 1,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        name: 'Detail Panel',
      },
      footer: {
        parent: null,
        layout: 'VERTICAL',
        spacing: 12,
        padding: { top: 16, right: 0, bottom: 0, left: 0 },
        name: 'Footer Actions',
      },
    },
    requiredSlots: ['header', 'surface-tabs', 'tree', 'detail', 'footer'],
  },
};

function getSurfaceConfig(meta?: SchemaDocument['meta']): SurfaceConfig {
  const key = meta?.designSurface?.toLowerCase();
  if (key && SURFACE_CONFIGS[key]) {
    return SURFACE_CONFIGS[key];
  }
  return SURFACE_CONFIGS.plugin;
}

function normalizeSlotName(slot?: string | null): string | null {
  if (!slot) return null;
  const normalized = slot.trim().toLowerCase();
  return normalized.length ? normalized : null;
}

function resolveSlotContainer(
  root: FrameNode,
  slotId: string | null,
  surface: SurfaceConfig,
): FrameNode {
  if (!slotId) return root;
  if (!surface.slots[slotId]) {
    return root;
  }
  return ensureSlotContainer(root, slotId, surface);
}

function ensureSlotContainer(root: FrameNode, slotId: string, surface: SurfaceConfig): FrameNode {
  const config = surface.slots[slotId];
  if (!config) return root;

  let parent: FrameNode = root;
  if (config.parent) {
    parent = ensureSlotContainer(root, config.parent, surface);
  }

  const slotName = `Slot:${surface.id}:${slotId}`;
  const existing = parent.findOne((node) => node.type === 'FRAME' && node.name === slotName);
  if (existing) {
    applySlotLayout(existing as FrameNode, config);
    return existing as FrameNode;
  }

  const frame = figma.createFrame();
  frame.name = slotName;
  applySlotLayout(frame, config);
  parent.appendChild(frame);
  return frame;
}

function applySlotLayout(frame: FrameNode, config: SlotConfig) {
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

  if (typeof config.grow === 'number') {
    frame.layoutGrow = config.grow;
  }

  if (config.width && config.width !== 'hug') {
    frame.primaryAxisSizingMode = 'FIXED';
    frame.resizeWithoutConstraints(config.width, Math.max(frame.height, 10));
  }

  if (config.height && config.height !== 'hug') {
    frame.counterAxisSizingMode = 'FIXED';
    frame.resizeWithoutConstraints(Math.max(frame.width, 10), config.height);
  }
}

function applySurfaceLayout(root: FrameNode, surface: SurfaceConfig) {
  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'AUTO';
  root.itemSpacing = surface.spacing;

  const padding = surface.padding ?? {};
  root.paddingTop = padding.top ?? 0;
  root.paddingRight = padding.right ?? 0;
  root.paddingBottom = padding.bottom ?? 0;
  root.paddingLeft = padding.left ?? 0;

  root.strokes = [];
  if (root.fills === figma.mixed || root.fills.length === 0) {
    root.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  }

  root.resizeWithoutConstraints(surface.width, Math.max(root.height, 10));
}

function calculateNextY(page: PageNode): number {
  if (page.children.length === 0) return 0;
  const bottoms = page.children.map((child) => child.y + child.height);
  return Math.max(...bottoms, 0) + 40;
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
