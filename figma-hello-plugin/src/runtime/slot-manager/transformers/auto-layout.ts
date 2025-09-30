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
};

export const applySurfaceLayout = (root: FrameNode, surface: SurfaceConfig) => {
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
};

export const applySlotLayout = (
  frame: FrameNode,
  config: SurfaceSlotConfig,
  surface: SurfaceConfig,
  slotId: string,
) => {
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
  } else if (frame.layoutMode === 'HORIZONTAL') {
    frame.counterAxisSizingMode = 'AUTO';
  }

  if (config.height && config.height !== 'hug') {
    if (typeof config.height === 'number') {
      frame.counterAxisSizingMode = 'FIXED';
      frame.resizeWithoutConstraints(Math.max(frame.width, 10), config.height);
    }
  }

  const surfaceHash = computeSurfaceHash(surface);
  const slotHash = computeSlotHash(surface.slots[slotId] ?? config);
  frame.setPluginData(PLUGINDATA_KEYS.surfaceId, surface.id);
  frame.setPluginData(PLUGINDATA_KEYS.surfaceHash, surfaceHash);
  frame.setPluginData(PLUGINDATA_KEYS.slotId, slotId);
  frame.setPluginData(PLUGINDATA_KEYS.slotHash, slotHash);
};
