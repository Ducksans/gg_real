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

const root = document.getElementById('root');

if (root) {
  const executionStore = createExecutionStore();
  const logStore = createLogStore();
  const guardrailStore = createGuardrailStore();
  const previewStore = createPreviewStore();
  const sectionStore = createSectionStore();

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
}
