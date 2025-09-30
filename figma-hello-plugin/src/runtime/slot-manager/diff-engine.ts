import { appendNodesFromSchema, type BuildContext } from '../../lib/nodeFactory';
import type { NodeSpec, NodeOperation } from '../../schema';
import { computeNodeKey, computeSlotHash, computeSurfaceHash } from '../surface-config';
import type { SurfaceConfig } from '../surface-config';
import { PLUGINDATA_KEYS } from '../utils';
import { decorateWithMetadata } from './metadata';

export const syncSlotChildren = async (
  slotFrame: FrameNode,
  specs: NodeSpec[],
  ctx: BuildContext,
  surface: SurfaceConfig,
  slotId: string | null,
  mode: 'append' | 'replace' | 'update' = 'append',
): Promise<SceneNode[]> => {
  if (!specs?.length) {
    return [];
  }

  const normalizedSlotId = slotId ?? '';
  const surfaceHash = computeSurfaceHash(surface);
  const slotConfig = normalizedSlotId ? surface.slots[normalizedSlotId] : undefined;
  const slotHash = slotConfig ? computeSlotHash(slotConfig) : surfaceHash;

  if (mode === 'replace') {
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

      decorateWithMetadata(spec, surface, normalizedSlotId, surfaceHash, slotHash, nodeKey);
      toCreate.push(spec);
    }
  });

  if (!toCreate.length) {
    return [];
  }

  return appendNodesFromSchema(slotFrame, toCreate, ctx);
};
