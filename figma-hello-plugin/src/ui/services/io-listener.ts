// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { useEffect } from 'preact/hooks';
import type { ExecutionStore } from '../store/executionStore';
import type { LogStore } from '../store/logStore';

interface ListenerDeps {
  executionStore: ExecutionStore;
  logStore: LogStore;
}

interface RuntimeResultPayload {
  intent?: 'dry-run' | 'apply';
  summary?: string;
  warnings: string[];
  errors: string[];
  metrics?: {
    created: number;
    warnings: number;
    errors: number;
  };
}

type RuntimeMessage =
  | { type: 'dry-run-result'; payload: RuntimeResultPayload }
  | { type: 'dry-run-warning'; message: string }
  | { type: 'dry-run-error'; message: string }
  | { type: 'dry-run-success'; message: string };

const resolveRuntimeMessage = (event: MessageEvent): RuntimeMessage | null => {
  const raw = (event.data && (event.data as any).pluginMessage) ?? event.data;
  if (!raw || typeof raw !== 'object' || !('type' in raw)) {
    return null;
  }
  return raw as RuntimeMessage;
};

const handleRuntimeMessage = (
  message: RuntimeMessage,
  executionStore: ExecutionStore,
  logStore: LogStore,
) => {
  switch (message.type) {
    case 'dry-run-result': {
      executionStore.setIdle();
      const { intent = 'dry-run', summary, warnings, errors } = message.payload;
      const summaryText = summary ?? `${intent === 'apply' ? 'Apply' : 'Dry-run'} 완료`;
      logStore.addEntry({
        intent,
        summary: summaryText,
        warnings: warnings ?? [],
        errors: errors ?? [],
      });
      break;
    }
    case 'dry-run-warning':
    case 'dry-run-error':
    case 'dry-run-success':
      executionStore.setIdle();
      break;
    default:
      break;
  }
};

const addListener = ({ executionStore, logStore }: ListenerDeps) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handler = (event: MessageEvent) => {
    const message = resolveRuntimeMessage(event);
    if (!message) return;
    handleRuntimeMessage(message, executionStore, logStore);
  };

  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
};

export const useRuntimeListener = ({ executionStore, logStore }: ListenerDeps) => {
  useEffect(() => addListener({ executionStore, logStore }), [executionStore, logStore]);
};

export const attachRuntimeListener = (deps: ListenerDeps) => addListener(deps);
