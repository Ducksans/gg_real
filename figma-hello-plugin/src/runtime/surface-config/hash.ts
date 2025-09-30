import type { SurfaceConfig, SurfaceSlotConfig } from './types';

export const computeSurfaceHash = (_config: SurfaceConfig): string => {
  throw new Error('computeSurfaceHash not implemented');
};

export const computeSlotHash = (_slot: SurfaceSlotConfig): string => {
  throw new Error('computeSlotHash not implemented');
};
