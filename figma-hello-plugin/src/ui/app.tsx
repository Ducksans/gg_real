// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { ExecutionPanel, PreviewControls, ResultLog } from './components';
import { useRuntimeListener } from './services';
import type { ExecutionStore, GuardrailStore, LogStore, PreviewStore, SectionStore } from './store';

import './styles/app.css';

interface AppProps {
  executionStore: ExecutionStore;
  guardrailStore: GuardrailStore;
  logStore: LogStore;
  previewStore: PreviewStore;
  sectionStore: SectionStore;
}

export const App = (props: AppProps) => <Shell {...props} />;

const Shell = ({
  executionStore,
  guardrailStore,
  logStore,
  previewStore,
  sectionStore,
}: AppProps) => {
  useRuntimeListener({
    executionStore,
    guardrailStore,
    logStore,
    previewStore,
    sectionStore,
  });

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
        />
        <div class="plugin-shell__side">
          <PreviewControls previewStore={previewStore} guardrailStore={guardrailStore} />
          <ResultLog logStore={logStore} />
        </div>
      </main>
    </div>
  );
};
