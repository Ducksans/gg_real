// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { signal, type Signal } from '@preact/signals';

export interface LogEntry {
  id: string;
  timestamp: number;
  intent: 'dry-run' | 'apply';
  summary: string;
  warnings: string[];
  errors: string[];
}

export interface LogStore {
  state: Signal<LogEntry[]>;
  addEntry: (entry: Partial<Omit<LogEntry, 'id' | 'timestamp'>> & Pick<LogEntry, 'intent'>) => void;
}

const MAX_LOGS = 20;

export const createLogStore = (): LogStore => {
  const state = signal<LogEntry[]>([]);

  return {
    state,
    addEntry(entry) {
      const payload: LogEntry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        timestamp: Date.now(),
        intent: entry.intent,
        summary: entry.summary ?? `${entry.intent === 'apply' ? 'Apply' : 'Dry-run'} 완료`,
        warnings: entry.warnings ?? [],
        errors: entry.errors ?? [],
      };
      state.value = [payload, ...state.value].slice(0, MAX_LOGS);
    },
  };
};
