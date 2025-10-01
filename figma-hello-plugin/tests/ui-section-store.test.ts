import { describe, expect, it } from 'vitest';

import { createSectionStore } from '../src/ui/store/sectionStore';
import type { SectionInfo } from '../src/ui/services/schema-builder';

describe('sectionStore guardrail handling', () => {
  const buildSection = (
    id: string,
    guardrail: SectionInfo['guardrail'] = 'normal',
  ): SectionInfo => ({
    id,
    label: `Section ${id}`,
    guardrail,
    guardrailMetrics:
      guardrail && guardrail !== 'normal'
        ? { nodeCount: guardrail === 'fail' ? 210 : 130, depth: 3, fileSize: 4096 }
        : undefined,
  });

  it('starts with no selection while exposing available sections', () => {
    const store = createSectionStore();
    store.setAvailableSections([
      buildSection('safe'),
      buildSection('warn', 'warn'),
      buildSection('fail', 'fail'),
    ]);

    expect(store.state.value.availableSections.map((section) => section.id)).toEqual([
      'safe',
      'warn',
      'fail',
    ]);
    expect(store.state.value.selectedSectionIds).toEqual([]);
  });

  it('allows manual opt-in for FAIL sections when the user toggles them explicitly', () => {
    const store = createSectionStore();
    store.setAvailableSections([buildSection('safe'), buildSection('fail', 'fail')]);

    store.toggleSelection('fail');

    expect(store.state.value.selectedSectionIds).toContain('fail');
  });
});
