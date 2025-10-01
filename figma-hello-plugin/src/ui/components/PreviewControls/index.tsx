import { useMemo } from 'preact/hooks';
import type { GuardrailStore, PreviewStore } from '../../store';
import { createPreviewService } from '../../services';
import { BeforeAfter } from './BeforeAfter';
import { SlotHighlight } from './SlotHighlight';

import './preview-controls.css';

interface PreviewControlsProps {
  previewStore: PreviewStore;
  guardrailStore: GuardrailStore;
}

export const PreviewControls = ({ previewStore, guardrailStore }: PreviewControlsProps) => {
  const previewState = previewStore.state.value;
  const guardrailMetrics = guardrailStore.state.value.metrics;
  const previewService = useMemo(() => createPreviewService(previewStore), [previewStore]);

  return (
    <section class="card preview-card">
      <header class="preview-card__header">
        <span>Preview 상태</span>
        <span class="preview-card__meta">{previewState.sections.length} 섹션</span>
      </header>
      <div class="preview-card__actions">
        <button
          class="preview-card__button"
          type="button"
          onClick={() => previewService.focusFrame()}
          disabled={!previewState.frameName}
        >
          프레임 포커스
        </button>
        <button
          class="preview-card__button"
          type="button"
          onClick={() => previewService.highlightSections(previewState.sections)}
          disabled={previewState.sections.length === 0}
        >
          섹션 하이라이트
        </button>
      </div>
      <dl class="preview-card__meta-grid">
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
