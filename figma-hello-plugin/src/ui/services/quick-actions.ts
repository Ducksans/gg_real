// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import type { ExecutionStore } from '../store/executionStore';
import type { GuardrailStore } from '../store/guardrailStore';
import type { LogStore } from '../store/logStore';
import type { PreviewStore } from '../store/previewStore';
import type { SectionStore } from '../store/sectionStore';
import type { TargetStore } from '../store/targetStore';
import { createCheckpointDraft } from './checkpoint';

interface QuickActionsDeps {
  guardrailStore: GuardrailStore;
  logStore: LogStore;
  previewStore: PreviewStore;
  sectionStore: SectionStore;
  targetStore: TargetStore;
  executionStore: ExecutionStore;
}

const postMessage = (type: string, payload?: Record<string, unknown>) => {
  if (typeof window === 'undefined' || !window.parent) return;
  window.parent.postMessage(
    {
      pluginMessage: {
        type,
        ...(payload ?? {}),
      },
    },
    '*',
  );
};

export const createQuickActionsService = (deps: QuickActionsDeps) => {
  const requestSample = () => {
    postMessage('request-sample');
  };

  const createHello = () => {
    postMessage('create-hello');
  };

  const closePlugin = () => {
    postMessage('close-plugin');
  };

  const buildCheckpointDraft = () => {
    const executionHistory = deps.logStore.state.value;
    const latestResult = deps.executionStore.state.value.lastResult;
    if (!executionHistory.length && !latestResult) {
      throw new Error('체크포인트를 생성할 실행 로그가 없습니다.');
    }
    const latest = executionHistory[0];
    const sections = deps.sectionStore.state.value.selectedSectionIds;
    const guardrail = deps.guardrailStore.state.value;
    const preview = deps.previewStore.state.value;
    const target = deps.targetStore.state.value;

    return createCheckpointDraft({ latest, latestResult, sections, guardrail, preview, target });
  };

  return {
    requestSample,
    createHello,
    closePlugin,
    buildCheckpointDraft,
  };
};
