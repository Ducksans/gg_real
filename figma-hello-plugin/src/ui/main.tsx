// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { render } from 'preact';
import { App } from './app';
import { createExecutionStore, createLogStore } from './store';

const root = document.getElementById('root');

if (root) {
  const executionStore = createExecutionStore();
  const logStore = createLogStore();

  render(<App executionStore={executionStore} logStore={logStore} />, root);
}
