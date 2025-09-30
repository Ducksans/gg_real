// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import type { SectionInfo } from '../../services/schema-builder';

export interface SectionItemProps {
  readonly section: SectionInfo;
  readonly selected: boolean;
  readonly onToggle: (sectionId: string) => void;
}

export const SectionItem = ({ section, selected, onToggle }: SectionItemProps) => (
  <li class="section-item">
    <label class="section-item__label">
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(section.id)}
        aria-label={`섹션 ${section.label} 선택`}
      />
      <span class="section-item__text">
        <strong>{section.label}</strong>
        {section.slotLabel && <span class="section-item__slot">{section.slotLabel}</span>}
        {section.description && <span class="section-item__desc">{section.description}</span>}
      </span>
    </label>
  </li>
);
