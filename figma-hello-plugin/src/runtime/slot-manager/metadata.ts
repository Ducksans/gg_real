import type { FrameNodeSpec, NodeSpec } from '../../schema';
import type { SurfaceConfig } from '../surface-config';
import { PLUGINDATA_KEYS } from '../utils';

export const decorateWithMetadata = (
  spec: NodeSpec,
  surface: SurfaceConfig,
  slotId: string,
  surfaceHash: string,
  slotHash: string,
  nodeKey?: string,
  owner?: {
    section?: string | null;
    ownerId?: string | null;
  },
) => {
  const baseData = spec.pluginData ? { ...spec.pluginData } : {};
  baseData[PLUGINDATA_KEYS.surfaceId] = surface.id;
  baseData[PLUGINDATA_KEYS.surfaceHash] = surfaceHash;
  baseData[PLUGINDATA_KEYS.slotId] = slotId;
  baseData[PLUGINDATA_KEYS.slotHash] = slotHash;
  if (nodeKey) {
    baseData[PLUGINDATA_KEYS.nodeKey] = nodeKey;
  }
  if (owner?.section) {
    baseData[PLUGINDATA_KEYS.ownerSection] = owner.section;
  }
  if (owner?.ownerId) {
    baseData[PLUGINDATA_KEYS.ownerId] = owner.ownerId;
  }
  spec.pluginData = baseData;

  if ('children' in spec && Array.isArray((spec as FrameNodeSpec).children)) {
    ((spec as FrameNodeSpec).children ?? []).forEach((child: NodeSpec) => {
      decorateWithMetadata(child, surface, slotId, surfaceHash, slotHash, undefined, owner);
    });
  }
};
