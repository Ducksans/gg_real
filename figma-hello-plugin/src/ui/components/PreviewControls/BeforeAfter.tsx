// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

interface BeforeAfterProps {
  readonly beforeFrameName?: string;
  readonly afterFrameName?: string;
}

export const BeforeAfter = ({ beforeFrameName, afterFrameName }: BeforeAfterProps) => (
  <div class="preview-before-after">
    <h3 class="preview-before-after__title">Before / After</h3>
    <div class="preview-before-after__grid">
      <div>
        <span class="preview-before-after__label">Before</span>
        <span class="preview-before-after__value">{beforeFrameName ?? '이전 프리뷰 없음'}</span>
      </div>
      <div>
        <span class="preview-before-after__label">After</span>
        <span class="preview-before-after__value">{afterFrameName ?? '최신 프리뷰 없음'}</span>
      </div>
    </div>
  </div>
);
