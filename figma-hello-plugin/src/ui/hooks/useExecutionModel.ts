// doc_refs: ["admin/docs/execution-contract.md", "admin/plan/legacy/figmaplugin-refactor.md"]

import { useMemo } from 'preact/hooks';

import { createExecutionService } from '../services';
import { buildSchemaDocuments } from '../services/schema-builder';
import { evaluateGuardrailPreflight } from '../services/guardrail-preflight';
import { sanitizeExecutionPayload, type ExecutionPayload } from '../../shared/execution-contract';
import type { ExecutionStore, GuardrailStore, SectionStore, TargetStore } from '../store';
import type { GuardrailIssue } from '../store/guardrailStore';

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

    const preflight = evaluateGuardrailPreflight(documentsWithTarget);

    const warningIssues: GuardrailIssue[] = preflight.warnings.map((issue, index) => ({
      id: `guardrail-warning-${issue.kind}-${issue.sectionId ?? 'unknown'}-${index}-${Date.now()}`,
      message: issue.message,
      severity: 'warning',
    }));

    const errorIssues: GuardrailIssue[] = preflight.errors.map((issue, index) => ({
      id: `guardrail-error-${issue.kind}-${issue.sectionId ?? 'unknown'}-${index}-${Date.now()}`,
      message: issue.message,
      severity: 'error',
    }));

    const metricsPayload =
      preflight.metrics.maxNodeCount > 0 ||
      preflight.metrics.maxDepth > 0 ||
      preflight.metrics.maxFileSize > 0
        ? {
            nodeCount: preflight.metrics.maxNodeCount || undefined,
            depth: preflight.metrics.maxDepth || undefined,
            fileSize: preflight.metrics.maxFileSize || undefined,
            warnings: warningIssues.length || undefined,
            errors: errorIssues.length || undefined,
          }
        : null;

    if (errorIssues.length) {
      guardrailStore.setSnapshot({
        warnings: warningIssues,
        errors: errorIssues,
        metrics: metricsPayload,
        intent,
      });
      console.error('[plugin-ui] Guardrail preflight blocked execution', errorIssues);
      return;
    }

    if (warningIssues.length) {
      guardrailStore.setSnapshot({
        warnings: warningIssues,
        errors: [],
        metrics: metricsPayload,
        intent,
      });
    }

    try {
      const payload: ExecutionPayload = sanitizeExecutionPayload({
        intent,
        documents: documentsWithTarget.map((document) => JSON.stringify(document)),
        targetPage: targetState.selectedPage,
        targetMode: targetState.mode ?? undefined,
        targetFrameName: targetState.frameName ?? undefined,
      });

      executionService.execute(payload);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Execution payload를 준비하는 중 오류가 발생했습니다.';

      const issues: GuardrailIssue[] = [
        {
          id: `execution-payload-${Date.now()}`,
          message,
          severity: 'error',
        },
      ];

      guardrailStore.setSnapshot({
        warnings: [],
        errors: issues,
        metrics: null,
        intent,
      });

      console.error('[plugin-ui] Execution payload validation failed', error);
    }
  };

  return {
    documents,
    selectionCount: selectedSectionIds.length,
    hasSelection,
    run,
  };
};
