export const PLUGINDATA_KEYS = {
  surfaceId: '__auto_surfaceId',
  surfaceHash: '__auto_surfaceHash',
  slotId: '__auto_slotId',
  slotHash: '__auto_slotHash',
  nodeKey: '__auto_nodeKey',
} as const;

export const normalizeSlotName = (slot?: string | null): string | null => {
  if (!slot) return null;
  const normalized = slot.trim().toLowerCase();
  return normalized.length ? normalized : null;
};
