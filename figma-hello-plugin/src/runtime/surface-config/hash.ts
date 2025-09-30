import type { SurfaceConfig, SurfaceSlotConfig } from './types';

const stableHash = (value: string): string => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return `h${(hash >>> 0).toString(16)}`;
};

export const computeSurfaceHash = (config: SurfaceConfig): string =>
  stableHash(
    JSON.stringify({
      width: config.width,
      height: config.height,
      padding: config.padding,
      spacing: config.spacing,
    }),
  );

export const computeSlotHash = (slot: SurfaceSlotConfig): string =>
  stableHash(
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

export const computeNodeKey = (surfaceId: string, slotId: string, seed: string): string =>
  stableHash(`${surfaceId}|${slotId}|${seed}`);
