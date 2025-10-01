import { useMemo } from 'preact/hooks';
import type {
  ExecutionStore,
  GuardrailStore,
  LogStore,
  PreviewStore,
  SectionStore,
  TargetStore,
} from '../../store';
import { createQuickActionsService } from '../../services/quick-actions';
import { SampleLoader } from './SampleLoader';
import { HelloAction } from './HelloAction';
import { CheckpointAction } from './CheckpointAction';

import './quick-actions.css';

interface QuickActionsProps {
  guardrailStore: GuardrailStore;
  logStore: LogStore;
  previewStore: PreviewStore;
  sectionStore: SectionStore;
  targetStore: TargetStore;
  executionStore: ExecutionStore;
}

export const QuickActions = ({
  guardrailStore,
  logStore,
  previewStore,
  sectionStore,
  targetStore,
  executionStore,
}: QuickActionsProps) => {
  const service = useMemo(
    () =>
      createQuickActionsService({
        guardrailStore,
        logStore,
        previewStore,
        sectionStore,
        targetStore,
        executionStore,
      }),
    [guardrailStore, logStore, previewStore, sectionStore, targetStore, executionStore],
  );

  const hasExecutionRecord =
    logStore.state.value.length > 0 || Boolean(executionStore.state.value.lastResult);

  const handleCheckpoint = () => {
    try {
      const draft = service.buildCheckpointDraft();
      if (!draft) return;
      const blob = new Blob([draft.content], {
        type: 'text/markdown;charset=utf-8',
      });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = draft.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      console.info(`[plugin-ui] 체크포인트 초안을 ${draft.filename} 이름으로 다운로드했습니다.`);
    } catch (error) {
      console.error('[plugin-ui] 체크포인트 생성에 실패했습니다.', error);
    }
  };

  return (
    <section class="card quick-actions">
      <header class="quick-actions__header">
        <span>빠른 실행</span>
      </header>
      <div class="quick-actions__grid">
        <SampleLoader onLoadSample={service.requestSample} />
        <HelloAction onCreateHello={service.createHello} />
        <CheckpointAction
          onCreateCheckpoint={handleCheckpoint}
          hasExecutionLog={hasExecutionRecord}
        />
        <button class="quick-actions__button" onClick={service.closePlugin}>
          플러그인 닫기
        </button>
      </div>
    </section>
  );
};
