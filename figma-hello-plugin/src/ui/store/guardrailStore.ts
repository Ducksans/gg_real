// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { signal, type Signal } from '@preact/signals';

export type GuardrailSeverity = 'warning' | 'error';

export interface GuardrailIssue {
  readonly id: string;
  readonly message: string;
  readonly severity: GuardrailSeverity;
}

export interface GuardrailMetrics {
  readonly nodeCount?: number;
  readonly depth?: number;
  readonly fileSize?: number;
  readonly created?: number;
  readonly warnings?: number;
  readonly errors?: number;
}

export interface GuardrailState {
  readonly warnings: GuardrailIssue[];
  readonly errors: GuardrailIssue[];
  readonly metrics: GuardrailMetrics | null;
  readonly history: GuardrailHistoryEntry[];
}

export interface GuardrailStore {
  readonly state: Signal<GuardrailState>;
  setSnapshot: (snapshot: GuardrailSnapshot) => void;
  reset: () => void;
}

export interface GuardrailHistoryEntry {
  readonly timestamp: number;
  readonly intent?: 'dry-run' | 'apply';
  readonly metrics: GuardrailMetrics;
}

export interface GuardrailSnapshot extends Partial<GuardrailState> {
  readonly intent?: 'dry-run' | 'apply';
}

const createInitialState = (): GuardrailState => ({
  warnings: [],
  errors: [],
  metrics: null,
  history: [],
});

export const createGuardrailStore = (): GuardrailStore => {
  const state = signal<GuardrailState>(createInitialState());

  return {
    state,
    setSnapshot(snapshot) {
      const current = state.value;
      const history = snapshot.metrics
        ? [
            ...current.history,
            { metrics: snapshot.metrics, timestamp: Date.now(), intent: snapshot.intent },
          ].slice(-10)
        : current.history;
      state.value = {
        warnings: snapshot.warnings ?? [],
        errors: snapshot.errors ?? [],
        metrics: snapshot.metrics ?? null,
        history,
      };
    },
    reset() {
      state.value = createInitialState();
    },
  };
};
