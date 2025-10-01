import { useEffect, useMemo } from 'preact/hooks';
import { PreviewControls, QuickActions, ResultLog } from './components';
import { RouteTree } from './components/RouteTree';
import { SchemaEditor } from './components/SchemaEditor';
import { GuardrailSummary } from './components/ExecutionPanel/GuardrailSummary';
import { ExecutionControls } from './components/ExecutionControls';
import { useRuntimeListener } from './services';
import type {
  ExecutionStore,
  GuardrailStore,
  LogStore,
  PreviewStore,
  RouteStore,
  SectionStore,
  TargetStore,
} from './store';
import { createExecutionService } from './services';
import { buildSchemaDocuments, getAvailableSections } from './services/schema-builder';

import './styles/tokens.css';
import './styles/base-layout.css';
import './styles/common/card.css';

interface AppProps {
  executionStore: ExecutionStore;
  guardrailStore: GuardrailStore;
  logStore: LogStore;
  previewStore: PreviewStore;
  sectionStore: SectionStore;
  routeStore: RouteStore;
  targetStore: TargetStore;
}

export const App = (props: AppProps) => <Shell {...props} />;

const Shell = ({
  executionStore,
  guardrailStore,
  logStore,
  previewStore,
  routeStore,
  sectionStore,
  targetStore,
}: AppProps) => {
  useRuntimeListener({
    executionStore,
    guardrailStore,
    logStore,
    previewStore,
    routeStore,
    sectionStore,
    targetStore,
  });

  const executionService = useMemo(() => createExecutionService(executionStore), [executionStore]);
  const { isRunning, lastIntent } = executionStore.state.value;
  const { selectedSectionIds } = sectionStore.state.value;
  const targetState = targetStore.state.value;

  useEffect(() => {
    routeStore.load();
    const sections = getAvailableSections();
    sectionStore.setAvailableSections(sections);
    sectionStore.selectSections(sections.map((section) => section.id));
  }, []);

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

  const selectionCount = selectedSectionIds.length;

  return (
    <div class="plugin-root">
      <div class="plugin-shell">
        <div class="workspace">
          <aside class="workspace__sidebar">
            <RouteTree routeStore={routeStore} sectionStore={sectionStore} />
          </aside>
          <section class="workspace__content">
            <div class="workspace__top">
              <ExecutionControls
                isRunning={isRunning}
                lastIntent={lastIntent}
                hasSelection={hasSelection}
                onRun={handleRun}
                selectionCount={selectionCount}
                targetStore={targetStore}
              />
              <GuardrailSummary guardrailStore={guardrailStore} />
            </div>
            <div class="workspace__middle">
              <SchemaEditor documents={documents} />
              <PreviewControls previewStore={previewStore} guardrailStore={guardrailStore} />
            </div>
            <div class="workspace__bottom">
              <QuickActions
                guardrailStore={guardrailStore}
                logStore={logStore}
                previewStore={previewStore}
                sectionStore={sectionStore}
                targetStore={targetStore}
                executionStore={executionStore}
              />
              <ResultLog logStore={logStore} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
