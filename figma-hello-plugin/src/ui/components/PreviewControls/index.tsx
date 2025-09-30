// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import type { GuardrailStore, PreviewStore } from '../../store';
import { BeforeAfter } from './BeforeAfter';
import { SlotHighlight } from './SlotHighlight';

interface PreviewControlsProps {
  previewStore: PreviewStore;
  guardrailStore: GuardrailStore;
}

export const PreviewControls = ({ previewStore, guardrailStore }: PreviewControlsProps) => {
  const previewState = previewStore.state.value;
  const guardrailMetrics = guardrailStore.state.value.metrics;

  return (
    <section class="panel panel--preview">
      <header class="panel__header">
        <h2>Preview 상태</h2>
      </header>
      <div class="panel__content">
        <dl class="preview-controls__meta">
          <div>
            <dt>최근 실행</dt>
            <dd>{previewState.lastIntent ? previewState.lastIntent.toUpperCase() : 'N/A'}</dd>
          </div>
          <div>
            <dt>프레임</dt>
            <dd>{previewState.frameName ?? '미지정'}</dd>
          </div>
          <div>
            <dt>페이지</dt>
            <dd>{previewState.page ?? '미지정'}</dd>
          </div>
          <div>
            <dt>생성 노드</dt>
            <dd>{guardrailMetrics?.created ?? 0}</dd>
          </div>
        </dl>
      </div>
      <BeforeAfter
        beforeFrameName={previewState.previousFrameName}
        afterFrameName={previewState.frameName}
      />
      <SlotHighlight sections={previewState.sections} />
    </section>
  );
};
