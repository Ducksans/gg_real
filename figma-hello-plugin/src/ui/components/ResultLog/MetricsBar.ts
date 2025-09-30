export interface MetricsBarProps {
  readonly metrics: Record<string, number>;
}

export const renderMetricsBar = (_props: MetricsBarProps) => {
  throw new Error('renderMetricsBar not implemented');
};
