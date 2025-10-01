// doc_refs: ["admin/plan/figmapluginmake.md"]

import type { TargetStore } from '../store';
import { TargetSelect } from './ExecutionPanel/TargetSelect';

import './execution-controls.css';

interface ExecutionControlsProps {
  isRunning: boolean;
  lastIntent: 'dry-run' | 'apply' | null;
  hasSelection: boolean;
  selectionCount: number;
  onRun: (intent: 'dry-run' | 'apply') => void;
  targetStore: TargetStore;
}

export const ExecutionControls = ({
  isRunning,
  lastIntent,
  hasSelection,
  selectionCount,
  onRun,
  targetStore,
}: ExecutionControlsProps) => {
  const disableRun = isRunning || !hasSelection;
  const dryRunLabel = isRunning && lastIntent === 'dry-run' ? 'Running…' : 'Dry Run';
  const applyLabel = isRunning && lastIntent === 'apply' ? 'Running…' : 'Apply';

  return (
    <section class="card execution-card">
      <header class="execution-card__header">
        <span class="execution-card__title">Execution</span>
        <span class="execution-card__meta">선택 {selectionCount}개</span>
      </header>
      <div class="execution-card__buttons">
        <button
          type="button"
          class="execution-card__button execution-card__button--primary"
          disabled={disableRun}
          onClick={() => onRun('dry-run')}
        >
          {dryRunLabel}
        </button>
        <button
          type="button"
          class="execution-card__button execution-card__button--primary"
          disabled={disableRun}
          onClick={() => onRun('apply')}
        >
          {applyLabel}
        </button>
      </div>
      <TargetSelect targetStore={targetStore} />
    </section>
  );
};
