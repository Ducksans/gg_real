// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { signal, type Signal } from '@preact/signals';

export interface ExecutionState {
  readonly isRunning: boolean;
  readonly lastIntent: 'dry-run' | 'apply' | null;
}

export interface ExecutionStore {
  state: Signal<ExecutionState>;
  setRunning: (intent: 'dry-run' | 'apply') => void;
  setIdle: () => void;
}

export const createExecutionStore = (): ExecutionStore => {
  const state = signal<ExecutionState>({ isRunning: false, lastIntent: null });

  return {
    state,
    setRunning(intent) {
      state.value = { isRunning: true, lastIntent: intent };
    },
    setIdle() {
      state.value = { ...state.value, isRunning: false };
    },
  };
};
