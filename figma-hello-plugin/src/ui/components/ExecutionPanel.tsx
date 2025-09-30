// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { useEffect, useMemo } from 'preact/hooks';
import type {
  ExecutionStore,
  GuardrailStore,
  SectionStore,
  RouteStore,
  TargetStore,
} from '../store';
import { createExecutionService } from '../services';
import { SectionList } from './SectionList';
import { SchemaEditor } from './SchemaEditor';
import { GuardrailSummary } from './ExecutionPanel/GuardrailSummary';
import { RouteTree } from './RouteTree';
import { TargetSelect } from './ExecutionPanel/TargetSelect';
import {
  buildSchemaDocuments,
  getAvailableSections,
  getSectionsForSlot,
} from '../services/schema-builder';

interface ExecutionPanelProps {
  executionStore: ExecutionStore;
  guardrailStore: GuardrailStore;
  sectionStore: SectionStore;
  routeStore: RouteStore;
  targetStore: TargetStore;
}

export const ExecutionPanel = ({
  executionStore,
  guardrailStore,
  sectionStore,
  routeStore,
  targetStore,
}: ExecutionPanelProps) => {
  const executionService = useMemo(() => createExecutionService(executionStore), [executionStore]);
  const { isRunning, lastIntent } = executionStore.state.value;
  const { selectedSectionIds } = sectionStore.state.value;
  const { selectedSurfaceId, selectedSlotId } = routeStore.state.value;
  const targetState = targetStore.state.value;

  useEffect(() => {
    if (!routeStore.state.value.surfaces.length) {
      routeStore.load();
    }
  }, []);

  useEffect(() => {
    if (!selectedSurfaceId || !selectedSlotId) {
      const allSections = getAvailableSections();
      sectionStore.setAvailableSections(allSections);
      sectionStore.selectSections(allSections.map((section) => section.id));
      return;
    }
    const allowedSections = getSectionsForSlot(selectedSurfaceId, selectedSlotId);
    if (allowedSections.length) {
      sectionStore.setAvailableSections(allowedSections);
      sectionStore.selectSections(allowedSections.map((section) => section.id));
    } else {
      const allSections = getAvailableSections();
      sectionStore.setAvailableSections(allSections);
      sectionStore.selectSections(allSections.map((section) => section.id));
    }
  }, [selectedSurfaceId, selectedSlotId]);

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

  const handleRun = (intent: 'dry-run' | 'apply') => {
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
        <RouteTree routeStore={routeStore} />
        <SectionList sectionStore={sectionStore} />
        <SchemaEditor documents={documents} />
      </div>
      <div class="panel__content panel__content--secondary">
        <TargetSelect targetStore={targetStore} />
      </div>
      <GuardrailSummary guardrailStore={guardrailStore} />
    </section>
  );
};
