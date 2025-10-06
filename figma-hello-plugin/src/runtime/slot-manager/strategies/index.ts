import type { SurfaceConfig } from '../../surface-config';

import { applySlotLayout } from '../transformers/auto-layout';
import { PLUGINDATA_KEYS } from '../../utils';

const ensureSlotContainerInternal = (
  root: FrameNode,
  slotId: string,
  surface: SurfaceConfig,
  visited = new Set<string>(),
): FrameNode => {
  const config = surface.slots[slotId];
  if (!config) return root;

  if (visited.has(slotId)) {
    return root;
  }
  visited.add(slotId);

  let parent: FrameNode = root;
  if (config.parent) {
    parent = ensureSlotContainerInternal(root, config.parent, surface, visited);
  }

  const slotName = `Slot:${surface.id}:${slotId}`;

  if (
    parent.name === slotName ||
    (parent.getPluginData(PLUGINDATA_KEYS.surfaceId) === surface.id &&
      parent.getPluginData(PLUGINDATA_KEYS.slotId) === slotId)
  ) {
    applySlotLayout(parent, config, surface, slotId);
    return parent;
  }

  const existing = parent.findOne((node) => {
    if (node.type !== 'FRAME') return false;
    const frame = node as FrameNode;
    if (frame.name === slotName) return true;
    const surfaceIdData = frame.getPluginData(PLUGINDATA_KEYS.surfaceId);
    const slotIdData = frame.getPluginData(PLUGINDATA_KEYS.slotId);
    return surfaceIdData === surface.id && slotIdData === slotId;
  });
  if (existing) {
    applySlotLayout(existing as FrameNode, config, surface, slotId);
    return existing as FrameNode;
  }

  const frame = figma.createFrame();
  frame.name = slotName;
  applySlotLayout(frame, config, surface, slotId);
  frame.setPluginData(PLUGINDATA_KEYS.surfaceId, surface.id);
  frame.setPluginData(PLUGINDATA_KEYS.slotId, slotId);
  parent.appendChild(frame);
  return frame;
};

export const ensureSlotContainer = (
  root: FrameNode,
  slotId: string,
  surface: SurfaceConfig,
): FrameNode => ensureSlotContainerInternal(root, slotId, surface);

export const resolveSlotContainer = (
  root: FrameNode,
  slotId: string | null,
  surface: SurfaceConfig,
): FrameNode => {
  if (!slotId) return root;
  if (!surface.slots[slotId]) {
    return root;
  }
  return ensureSlotContainer(root, slotId, surface);
};
