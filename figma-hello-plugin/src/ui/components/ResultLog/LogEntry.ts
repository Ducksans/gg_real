export interface LogEntryProps {
  readonly entry: unknown;
}

export const renderLogEntry = (_props: LogEntryProps) => {
  throw new Error('renderLogEntry not implemented');
};
