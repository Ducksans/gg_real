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
}

export interface GuardrailStore {
  readonly state: Signal<GuardrailState>;
  setSnapshot: (snapshot: Partial<GuardrailState>) => void;
  reset: () => void;
}

const createInitialState = (): GuardrailState => ({
  warnings: [],
  errors: [],
  metrics: null,
});

export const createGuardrailStore = (): GuardrailStore => {
  const state = signal<GuardrailState>(createInitialState());

  return {
    state,
    setSnapshot(snapshot) {
      state.value = {
        warnings: snapshot.warnings ?? [],
        errors: snapshot.errors ?? [],
        metrics: snapshot.metrics ?? null,
      };
    },
    reset() {
      state.value = createInitialState();
    },
  };
};
