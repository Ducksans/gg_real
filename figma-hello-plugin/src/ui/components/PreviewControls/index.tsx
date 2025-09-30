// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { useMemo } from 'preact/hooks';
import type { GuardrailStore, PreviewStore } from '../../store';
import { createPreviewService } from '../../services';
import { BeforeAfter } from './BeforeAfter';
import { SlotHighlight } from './SlotHighlight';

interface PreviewControlsProps {
  previewStore: PreviewStore;
  guardrailStore: GuardrailStore;
}

export const PreviewControls = ({ previewStore, guardrailStore }: PreviewControlsProps) => {
  const previewState = previewStore.state.value;
  const guardrailMetrics = guardrailStore.state.value.metrics;
  const previewService = useMemo(() => createPreviewService(previewStore), [previewStore]);

  return (
    <section class="panel panel--preview">
      <header class="panel__header">
        <h2>Preview 상태</h2>
      </header>
      <div class="panel__content">
        <div class="preview-controls__actions">
          <button
            class="preview-controls__button"
            type="button"
            onClick={() => previewService.focusFrame()}
            disabled={!previewState.frameName}
          >
            프레임 포커스
          </button>
          <button
            class="preview-controls__button"
            type="button"
            onClick={() => previewService.highlightSections(previewState.sections)}
            disabled={previewState.sections.length === 0}
          >
            섹션 하이라이트
          </button>
        </div>
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
            <dd>{previewState.createdCount ?? guardrailMetrics?.created ?? 0}</dd>
          </div>
          <div>
            <dt>슬롯</dt>
            <dd>{previewState.slotId ?? '미지정'}</dd>
          </div>
        </dl>
      </div>
      <BeforeAfter
        beforeFrameName={previewState.previousFrameName}
        afterFrameName={previewState.frameName}
      />
      <SlotHighlight
        sections={previewState.sections}
        onHighlight={(sectionId) => previewService.highlightSection(sectionId)}
      />
    </section>
  );
};
