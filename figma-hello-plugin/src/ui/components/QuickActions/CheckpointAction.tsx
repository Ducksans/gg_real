interface CheckpointActionProps {
  readonly onCreateCheckpoint: () => void;
  readonly hasExecutionLog: boolean;
}

export const CheckpointAction = ({
  onCreateCheckpoint,
  hasExecutionLog,
}: CheckpointActionProps) => (
  <button
    class="quick-actions__button quick-actions__button--primary"
    type="button"
    disabled={!hasExecutionLog}
    onClick={onCreateCheckpoint}
  >
    체크포인트 초안 만들기
  </button>
);
