import type { ExecutionStore } from '../store/executionStore';
import type { ExecutionPayload } from '../../shared/execution-contract';

export const createExecutionService = (executionStore: ExecutionStore) => {
  const postMessage = (payload: ExecutionPayload) => {
    executionStore.setRunning(payload.intent);
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage(
        {
          pluginMessage: {
            type: 'execute-schema',
            payload,
          },
        },
        '*',
      );
    }
  };

  return {
    execute(payload: ExecutionPayload) {
      postMessage(payload);
    },
  };
};
