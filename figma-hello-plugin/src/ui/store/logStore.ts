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
  readonly page?: string;
  readonly frameName?: string;
  readonly slotReport?: LogSlotReport;
}

interface AddEntryPayload {
  readonly intent: 'dry-run' | 'apply';
  readonly summary?: string;
  readonly guardrail?: Partial<LogGuardrailSnapshot>;
  readonly page?: string;
  readonly frameName?: string;
  readonly slotReport?: Partial<LogSlotReport>;
}

export interface LogSlotReport {
  readonly slotId?: string;
  readonly createdNodeIds: string[];
  readonly createdNodeNames: string[];
  readonly count: number;
  readonly warnings: string[];
  readonly executedSections: string[];
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
        page: entry.page,
        frameName: entry.frameName,
        slotReport: entry.slotReport
          ? {
              slotId: entry.slotReport.slotId,
              createdNodeIds: entry.slotReport.createdNodeIds ?? [],
              createdNodeNames: entry.slotReport.createdNodeNames ?? [],
              count: entry.slotReport.count ?? entry.slotReport.createdNodeIds?.length ?? 0,
              warnings: entry.slotReport.warnings ?? [],
              executedSections: entry.slotReport.executedSections ?? [],
            }
          : undefined,
      };
      state.value = [payload, ...state.value].slice(0, MAX_LOGS);
    },
  };
};
