// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { useEffect } from 'preact/hooks';
import { ExecutionPanel, PreviewControls, QuickActions, ResultLog } from './components';
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

import './styles/app.css';

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

  useEffect(() => {
    routeStore.load();
    const sections = getAvailableSections();
    sectionStore.setAvailableSections(sections);
    sectionStore.selectSections(sections.map((section) => section.id));
  }, []);

  useEffect(() => {
    if (!sectionStore.state.value.availableSections.length) {
      sectionStore.setAvailableSections(getAvailableSections());
    }
  }, []);

  return (
    <div class="plugin-shell">
      <header class="plugin-shell__header">
        <h1>GG Automation Plugin</h1>
      </header>
      <main class="plugin-shell__main">
        <ExecutionPanel
          executionStore={executionStore}
          guardrailStore={guardrailStore}
          sectionStore={sectionStore}
          routeStore={routeStore}
          targetStore={targetStore}
        />
        <div class="plugin-shell__side">
          <QuickActions
            guardrailStore={guardrailStore}
            logStore={logStore}
            previewStore={previewStore}
            sectionStore={sectionStore}
            targetStore={targetStore}
            executionStore={executionStore}
          />
          <PreviewControls previewStore={previewStore} guardrailStore={guardrailStore} />
          <ResultLog logStore={logStore} />
        </div>
      </main>
    </div>
  );
};
