import type { SurfaceConfig } from '../surface-config';
import type { SchemaDocument } from '../../schema';

const normalizeSlotName = (slot?: string | null): string | null => {
  if (!slot) return null;
  const normalized = slot.trim().toLowerCase();
  return normalized.length ? normalized : null;
};

export const validateSlotPlacement = (doc: SchemaDocument, surface: SurfaceConfig): string[] => {
  const warnings: string[] = [];
  const slotId = normalizeSlotName(doc.meta?.slot);
  if (!slotId) {
    return warnings;
  }

  const slot = surface.slots[slotId];
  if (!slot) {
    warnings.push(`슬롯 '${slotId}'는 ${surface.label} Surface에 정의되어 있지 않습니다.`);
    return warnings;
  }

  if (
    slot.allowedSections.length > 0 &&
    doc.meta?.section &&
    !slot.allowedSections.includes(doc.meta.section)
  ) {
    warnings.push(`${doc.meta.section} 섹션은 ${slot.label} 슬롯에 허용되지 않습니다.`);
  }

  return warnings;
};
