// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { useMemo } from 'preact/hooks';
import type { ExecutionStore } from '../store';
import { createExecutionService } from '../services';

interface ExecutionPanelProps {
  executionStore: ExecutionStore;
}

export const ExecutionPanel = ({ executionStore }: ExecutionPanelProps) => {
  const executionService = useMemo(() => createExecutionService(executionStore), [executionStore]);
  const { isRunning, lastIntent } = executionStore.state.value;

  return (
    <section class="panel">
      <header class="panel__header">
        <h2>Execution</h2>
      </header>
      <div class="panel__content">
        <button
          class="panel__button"
          disabled={isRunning}
          onClick={() => executionService.runDryRun()}
        >
          {isRunning && lastIntent === 'dry-run' ? 'Running...' : 'Dry Run'}
        </button>
        <button
          class="panel__button"
          disabled={isRunning}
          onClick={() => executionService.runApply()}
        >
          {isRunning && lastIntent === 'apply' ? 'Running...' : 'Apply'}
        </button>
      </div>
    </section>
  );
};
