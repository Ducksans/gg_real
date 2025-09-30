export interface ReadonlyPanelProps {
  readonly value: unknown;
}

export const renderReadonlyPanel = (_props: ReadonlyPanelProps) => {
  throw new Error('renderReadonlyPanel not implemented');
};
