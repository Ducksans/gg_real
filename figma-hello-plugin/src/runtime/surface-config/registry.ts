import type { SurfaceConfig } from './types';

export const resolveSurfaceConfig = (_surfaceId: string): SurfaceConfig => {
  throw new Error('resolveSurfaceConfig not implemented');
};

export const listRequiredSlots = (_surfaceId: string): string[] => {
  throw new Error('listRequiredSlots not implemented');
};
