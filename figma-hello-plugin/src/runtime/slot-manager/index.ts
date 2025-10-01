export { findTargetPage, removeExistingFrame, prepareTargetFrame } from './container-factory';
export { getPreviewCanvas, updatePreviewSummary } from './preview-template';
export { syncSlotChildren } from './diff-engine';
export { decorateWithMetadata } from './metadata';
export { buildSlotReport } from './reporter';
export { ensureSlotContainer, resolveSlotContainer } from './strategies';
export {
  applySurfaceLayout,
  applySlotLayout,
  ensureAutoLayout,
  calculateNextY,
} from './transformers/auto-layout';
export { profileSlotManager } from './profiling';
