// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { ExecutionPanel, ResultLog } from './components';
import { useRuntimeListener } from './services';
import type { ExecutionStore, LogStore } from './store';

import './styles/app.css';

interface AppProps {
  executionStore: ExecutionStore;
  logStore: LogStore;
}

export const App = ({ executionStore, logStore }: AppProps) => (
  <Shell executionStore={executionStore} logStore={logStore} />
);

const Shell = ({ executionStore, logStore }: AppProps) => {
  useRuntimeListener({ executionStore, logStore });

  return (
    <div class="plugin-shell">
      <header class="plugin-shell__header">
        <h1>GG Automation Plugin</h1>
      </header>
      <main class="plugin-shell__main">
        <ExecutionPanel executionStore={executionStore} />
        <ResultLog logStore={logStore} />
      </main>
    </div>
  );
};
