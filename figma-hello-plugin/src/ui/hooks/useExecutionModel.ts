import { useMemo } from 'preact/hooks';

import { createExecutionService } from '../services';
import { buildSchemaDocuments } from '../services/schema-builder';
import type { ExecutionStore, GuardrailStore, SectionStore, TargetStore } from '../store';

interface ExecutionModelDeps {
  executionStore: ExecutionStore;
  guardrailStore: GuardrailStore;
  sectionStore: SectionStore;
  targetStore: TargetStore;
}

interface ExecutionModel {
  documents: ReturnType<typeof buildSchemaDocuments>;
  selectionCount: number;
  hasSelection: boolean;
  run: (intent: 'dry-run' | 'apply') => void;
}

export const useExecutionModel = ({
  executionStore,
  guardrailStore,
  sectionStore,
  targetStore,
}: ExecutionModelDeps): ExecutionModel => {
  const executionService = useMemo(() => createExecutionService(executionStore), [executionStore]);
  const { selectedSectionIds } = sectionStore.state.value;
  const targetState = targetStore.state.value;

  const documents = useMemo(() => buildSchemaDocuments(selectedSectionIds), [selectedSectionIds]);

  const documentsWithTarget = useMemo(() => {
    if (!documents.length) return documents;
    const overridePage = targetState.selectedPage;
    const overrideMode = targetState.mode;
    const overrideFrame = targetState.frameName?.trim();

    return documents.map((document) => {
      const target = {
        ...(document.target ?? {}),
      } as NonNullable<typeof document.target>;

      if (overridePage) {
        target.page = overridePage;
      }

      if (overrideFrame) {
        target.frameName = overrideFrame;
      }

      if (overrideMode) {
        target.mode = overrideMode;
      }

      return {
        ...document,
        target,
      };
    });
  }, [documents, targetState.frameName, targetState.mode, targetState.selectedPage]);

  const hasSelection = selectedSectionIds.length > 0 && documents.length > 0;

  const run = (intent: 'dry-run' | 'apply') => {
    if (!hasSelection) {
      console.warn('[plugin-ui] 실행할 섹션이 없습니다.');
      return;
    }

    guardrailStore.reset();

    const payload: Record<string, unknown> = {
      documents: documentsWithTarget,
      sections: selectedSectionIds,
    };

    if (targetState.selectedPage) {
      payload.targetPage = targetState.selectedPage;
    }

    if (targetState.mode) {
      payload.targetMode = targetState.mode;
    }

    if (targetState.frameName?.trim()) {
      payload.targetFrameName = targetState.frameName.trim();
    }

    if (intent === 'dry-run') {
      executionService.runDryRun(payload);
    } else {
      executionService.runApply(payload);
    }
  };

  return {
    documents,
    selectionCount: selectedSectionIds.length,
    hasSelection,
    run,
  };
};
