interface SlotSummaryProps {
  readonly selectedCount: number;
  readonly totalCount: number;
}

export const SlotSummary = ({ selectedCount, totalCount }: SlotSummaryProps) => (
  <span class="route-slot__summary">{totalCount ? `${selectedCount}/${totalCount}` : '0/0'}</span>
);
