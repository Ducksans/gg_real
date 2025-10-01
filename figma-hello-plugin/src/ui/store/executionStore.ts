import { signal, type Signal } from '@preact/signals';

export interface ExecutionState {
  readonly isRunning: boolean;
  readonly lastIntent: 'dry-run' | 'apply' | null;
  readonly lastResult?: ExecutionResult;
}

export interface ExecutionStore {
  state: Signal<ExecutionState>;
  setRunning: (intent: 'dry-run' | 'apply') => void;
  setIdle: () => void;
  setResult: (result: ExecutionResult) => void;
  reset: () => void;
}

export interface ExecutionResult {
  readonly intent: 'dry-run' | 'apply';
  readonly summary: string;
  readonly page?: string;
  readonly frameName?: string;
  readonly sections: string[];
  readonly metrics: {
    readonly created: number;
    readonly warnings: number;
    readonly errors: number;
  };
  readonly slotReport?: ExecutionSlotReport;
  readonly timestamp: number;
  readonly debug?: ExecutionDebugInfo;
}

export interface ExecutionSlotReport {
  readonly slotId?: string;
  readonly createdNodeIds: string[];
  readonly createdNodeNames: string[];
  readonly warnings: string[];
  readonly executedSections: string[];
}

export interface ExecutionDebugInfo {
  readonly captureId?: string;
  readonly stage?: string;
  readonly rawPreview?: string;
  readonly rawLength?: number;
  readonly sanitized?: boolean;
  readonly removedBom?: boolean;
  readonly controlCharsRemoved?: boolean;
}

export const createExecutionStore = (): ExecutionStore => {
  const initialState: ExecutionState = { isRunning: false, lastIntent: null };
  const state = signal<ExecutionState>(initialState);

  return {
    state,
    setRunning(intent) {
      state.value = { isRunning: true, lastIntent: intent };
    },
    setIdle() {
      state.value = { ...state.value, isRunning: false };
    },
    setResult(result) {
      state.value = {
        isRunning: false,
        lastIntent: result.intent,
        lastResult: result,
      };
    },
    reset() {
      state.value = initialState;
    },
  };
};
