export interface BeforeAfterProps {
  readonly beforeFrameId: string;
  readonly afterFrameId: string;
}

export const renderBeforeAfter = (_props: BeforeAfterProps) => {
  throw new Error('renderBeforeAfter not implemented');
};
