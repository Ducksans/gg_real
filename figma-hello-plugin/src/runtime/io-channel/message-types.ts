export type RuntimeMessageType =
  | 'dry-run-result'
  | 'dry-run-warning'
  | 'dry-run-error'
  | 'apply-complete';

export interface RuntimeMessage {
  readonly type: RuntimeMessageType;
  readonly payload?: unknown;
}
