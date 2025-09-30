export { normalizeSurfaceManifest } from './normalizer';
export { computeSurfaceHash, computeSlotHash, computeNodeKey } from './hash';
export {
  resolveSurfaceConfig,
  listRequiredSlots,
  listSurfaceConfigs,
  resetSurfaceRegistry,
} from './registry';
export type { SurfaceConfig, SurfaceSlotConfig, SurfaceRouteSummary } from './types';
