// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import type { ExecutionStore } from '../store/executionStore';

interface ExecuteOptions {
  intent: 'dry-run' | 'apply';
  payload?: unknown;
}

export const createExecutionService = (executionStore: ExecutionStore) => {
  const postMessage = (options: ExecuteOptions) => {
    executionStore.setRunning(options.intent);
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage(
        {
          pluginMessage: {
            type: 'execute-schema',
            payload: options.payload,
            intent: options.intent,
          },
        },
        '*',
      );
    }
  };

  return {
    runDryRun(payload?: unknown) {
      postMessage({ intent: 'dry-run', payload });
    },
    runApply(payload?: unknown) {
      postMessage({ intent: 'apply', payload });
    },
  };
};
