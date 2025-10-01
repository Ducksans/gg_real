import { useEffect } from 'preact/hooks';
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
import { getAvailableSections } from './services/schema-builder';
import { useExecutionModel } from './hooks/useExecutionModel';

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

  const { isRunning, lastIntent } = executionStore.state.value;

  useEffect(() => {
    routeStore.load();
    const sections = getAvailableSections();
    sectionStore.setAvailableSections(sections);
  }, []);
  const { documents, selectionCount, hasSelection, run } = useExecutionModel({
    executionStore,
    guardrailStore,
    sectionStore,
    targetStore,
  });

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
                selectionCount={selectionCount}
                onRun={run}
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
