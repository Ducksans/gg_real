// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { signal, type Signal } from '@preact/signals';
import type { GuardrailIssue, GuardrailMetrics } from './guardrailStore';

export interface LogGuardrailSnapshot {
  readonly warnings: GuardrailIssue[];
  readonly errors: GuardrailIssue[];
  readonly metrics: GuardrailMetrics | null;
}

export interface LogEntry {
  readonly id: string;
  readonly timestamp: number;
  readonly intent: 'dry-run' | 'apply';
  readonly summary: string;
  readonly guardrail: LogGuardrailSnapshot;
}

interface AddEntryPayload {
  readonly intent: 'dry-run' | 'apply';
  readonly summary?: string;
  readonly guardrail?: Partial<LogGuardrailSnapshot>;
}

export interface LogStore {
  readonly state: Signal<LogEntry[]>;
  addEntry: (entry: AddEntryPayload) => void;
}

const MAX_LOGS = 20;

export const createLogStore = (): LogStore => {
  const state = signal<LogEntry[]>([]);

  return {
    state,
    addEntry(entry) {
      const guardrail: LogGuardrailSnapshot = {
        warnings: entry.guardrail?.warnings ? [...entry.guardrail.warnings] : [],
        errors: entry.guardrail?.errors ? [...entry.guardrail.errors] : [],
        metrics: entry.guardrail?.metrics ?? null,
      };

      const payload: LogEntry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        timestamp: Date.now(),
        intent: entry.intent,
        summary: entry.summary ?? `${entry.intent === 'apply' ? 'Apply' : 'Dry-run'} 완료`,
        guardrail,
      };
      state.value = [payload, ...state.value].slice(0, MAX_LOGS);
    },
  };
};
