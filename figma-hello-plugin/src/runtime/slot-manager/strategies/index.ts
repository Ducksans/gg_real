import type { SurfaceConfig } from '../../surface-config';

import { applySlotLayout } from '../transformers/auto-layout';

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
