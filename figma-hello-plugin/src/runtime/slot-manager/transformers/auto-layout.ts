import { resolvePaintToken } from '@lib/tokenRegistry';
import { computeSlotHash, computeSurfaceHash } from '../../surface-config';
import type { SurfaceConfig, SurfaceSlotConfig } from '../../surface-config';
import { PLUGINDATA_KEYS } from '../../utils';

export const calculateNextY = (page: PageNode): number => {
  if (page.children.length === 0) return 0;
  let maxBottom = 0;
  page.children.forEach((child) => {
    const bottom = child.y + child.height;
    if (bottom > maxBottom) {
      maxBottom = bottom;
    }
  });
  return maxBottom + 40;
};

export const ensureAutoLayout = (frame: FrameNode) => {
  frame.layoutMode = 'NONE';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';
  frame.itemSpacing = 0;
  frame.paddingTop = 0;
  frame.paddingRight = 0;
  frame.paddingBottom = 0;
  frame.paddingLeft = 0;
  if (frame.fills === figma.mixed || frame.fills.length === 0) {
    frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  }
};

export const applySurfaceLayout = (root: FrameNode, surface: SurfaceConfig) => {
  console.log('[applySurfaceLayout:before]', {
    frameName: root.name,
    surfaceId: surface.id,
    layoutMode: root.layoutMode,
  });
  root.layoutMode = 'NONE';
  const surfaceHash = computeSurfaceHash(surface);

  const hasFixedHeight = surface.height !== null && typeof surface.height === 'number';
  root.primaryAxisSizingMode = 'FIXED';
  root.counterAxisSizingMode = 'FIXED';

  const width = surface.width ?? Math.max(root.width, 10);
  const height = hasFixedHeight ? surface.height! : Math.max(root.height, 10);
  root.resizeWithoutConstraints(width, height);

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
  console.log('[applySurfaceLayout:after]', {
    frameName: root.name,
    layoutMode: root.layoutMode,
    width: root.width,
    height: root.height,
  });
};

export const applySlotLayout = (
  frame: FrameNode,
  config: SurfaceSlotConfig,
  surface: SurfaceConfig,
  slotId: string,
) => {
  console.log('[applySlotLayout:before]', {
    frameName: frame.name,
    slotId,
    layoutMode: frame.layoutMode,
  });
  frame.layoutMode = 'NONE';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';
  frame.paddingTop = config.padding?.top ?? 0;
  frame.paddingRight = config.padding?.right ?? 0;
  frame.paddingBottom = config.padding?.bottom ?? 0;
  frame.paddingLeft = config.padding?.left ?? 0;
  frame.strokes = [];
  frame.fills = [];
  frame.layoutGrow = 0;

  const surfaceWidth = surface.width ?? Math.max(frame.width, 10);
  const targetWidth =
    typeof config.width === 'number'
      ? config.width
      : config.width === 'fill'
        ? surfaceWidth
        : Math.max(frame.width, 10);

  const targetHeight =
    typeof config.height === 'number'
      ? config.height
      : config.height === 'fill'
        ? (surface.height ?? Math.max(frame.height, 10))
        : Math.max(frame.height, 10);

  frame.resizeWithoutConstraints(targetWidth ?? Math.max(frame.width, 10), targetHeight);

  const surfaceHash = computeSurfaceHash(surface);
  const slotHash = computeSlotHash(surface.slots[slotId] ?? config);
  frame.setPluginData(PLUGINDATA_KEYS.surfaceId, surface.id);
  frame.setPluginData(PLUGINDATA_KEYS.surfaceHash, surfaceHash);
  frame.setPluginData(PLUGINDATA_KEYS.slotId, slotId);
  frame.setPluginData(PLUGINDATA_KEYS.slotHash, slotHash);
  console.log('[applySlotLayout:after]', {
    frameName: frame.name,
    slotId,
    layoutMode: frame.layoutMode,
    width: frame.width,
    height: frame.height,
  });
};
