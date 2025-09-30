export { createSlotContainer } from './container-factory';
export { diffSlotChildren } from './diff-engine';
export { decorateWithMetadata } from './metadata';
export { buildSlotReport } from './reporter';
export { runDryRunStrategy, runApplyStrategy, runPreviewStrategy } from './strategies';
export { writeAuditMetadata, captureSlotSnapshot, formatSlotDiff } from './auditor';
export { applyAutoLayoutTransform, transformComponentInstance } from './transformers';
export { profileSlotManager } from './profiling';
