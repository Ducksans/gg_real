// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { useMemo } from 'preact/hooks';
import type { ExecutionStore, GuardrailStore, SectionStore } from '../store';
import { createExecutionService } from '../services';
import { SectionList } from './SectionList';
import { SchemaEditor } from './SchemaEditor';
import { GuardrailSummary } from './ExecutionPanel/GuardrailSummary';
import { buildSchemaDocuments } from '../services/schema-builder';

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
  const { selectedSectionIds } = sectionStore.state.value;

  const documents = useMemo(() => buildSchemaDocuments(selectedSectionIds), [selectedSectionIds]);

  const hasSelection = selectedSectionIds.length > 0 && documents.length > 0;

  const handleRun = (intent: 'dry-run' | 'apply') => {
    if (!hasSelection) {
      console.warn('[plugin-ui] 실행할 섹션이 없습니다.');
      return;
    }
    guardrailStore.reset();
    const payload = { documents, sections: selectedSectionIds };
    if (intent === 'dry-run') {
      executionService.runDryRun(payload);
    } else {
      executionService.runApply(payload);
    }
  };

  return (
    <section class="panel panel--execution">
      <header class="panel__header">
        <h2>Execution</h2>
      </header>
      <div class="panel__content">
        <button
          class="panel__button"
          disabled={isRunning || !hasSelection}
          onClick={() => handleRun('dry-run')}
        >
          {isRunning && lastIntent === 'dry-run' ? 'Running...' : 'Dry Run'}
        </button>
        <button
          class="panel__button"
          disabled={isRunning || !hasSelection}
          onClick={() => handleRun('apply')}
        >
          {isRunning && lastIntent === 'apply' ? 'Running...' : 'Apply'}
        </button>
      </div>
      <div class="panel__grid">
        <SectionList sectionStore={sectionStore} />
        <SchemaEditor documents={documents} />
      </div>
      <GuardrailSummary guardrailStore={guardrailStore} />
    </section>
  );
};
