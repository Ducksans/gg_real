// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { render } from 'preact';
import { App } from './app';
import {
  createExecutionStore,
  createGuardrailStore,
  createLogStore,
  createPreviewStore,
  createSectionStore,
} from './store';

const mount = () => {
  const root = document.getElementById('root');
  if (!root) {
    console.error('[plugin-ui] root element not found.');
    return;
  }

  const executionStore = createExecutionStore();
  const logStore = createLogStore();
  const guardrailStore = createGuardrailStore();
  const previewStore = createPreviewStore();
  const sectionStore = createSectionStore();

  console.info('[plugin-ui] mounting UI');
  render(
    <App
      executionStore={executionStore}
      logStore={logStore}
      guardrailStore={guardrailStore}
      previewStore={previewStore}
      sectionStore={sectionStore}
    />,
    root,
  );
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
