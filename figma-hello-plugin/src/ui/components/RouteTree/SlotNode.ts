export interface SlotNodeProps {
  readonly slot: unknown;
}

export const renderSlotNode = (_props: SlotNodeProps) => {
  throw new Error('renderSlotNode not implemented');
};
