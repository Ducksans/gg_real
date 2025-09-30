// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

interface SlotSummaryProps {
  readonly allowedCount: number;
}

export const SlotSummary = ({ allowedCount }: SlotSummaryProps) => (
  <span class="route-slot__summary">
    허용 섹션 {allowedCount > 0 ? `${allowedCount}개` : '전체'}
  </span>
);
