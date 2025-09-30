// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

interface SlotHighlightProps {
  readonly sections: string[];
}

export const SlotHighlight = ({ sections }: SlotHighlightProps) => (
  <div class="slot-highlight">
    <h3 class="slot-highlight__title">연관 섹션</h3>
    {sections.length === 0 ? (
      <p class="slot-highlight__empty">연관 섹션 정보가 없습니다.</p>
    ) : (
      <ul class="slot-highlight__list">
        {sections.map((sectionId) => (
          <li key={sectionId}>#{sectionId}</li>
        ))}
      </ul>
    )}
  </div>
);
