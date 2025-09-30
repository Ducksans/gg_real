// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { useMemo } from 'preact/hooks';
import type { ExecutionStore, GuardrailStore, SectionStore } from '../store';
import { createExecutionService } from '../services';
import { GuardrailSummary } from './ExecutionPanel/GuardrailSummary';
import { TargetSelect } from './ExecutionPanel/TargetSelect';

interface ExecutionPanelProps {
  executionStore: ExecutionStore;
  guardrailStore: GuardrailStore;
  sectionStore: SectionStore;
}

export const ExecutionPanel = ({
  executionStore,
  guardrailStore,
  sectionStore,
}: ExecutionPanelProps) => {
  const executionService = useMemo(() => createExecutionService(executionStore), [executionStore]);
  const { isRunning, lastIntent } = executionStore.state.value;

  return (
    <section class="panel panel--execution">
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
      <div class="panel__content panel__content--secondary">
        <TargetSelect sectionStore={sectionStore} />
      </div>
      <GuardrailSummary guardrailStore={guardrailStore} />
    </section>
  );
};
