// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import type { SchemaDocument } from '../../../schema';

interface ReadonlyPanelProps {
  readonly value: SchemaDocument | null | undefined;
}

export const ReadonlyPanel = ({ value }: ReadonlyPanelProps) => (
  <aside class="schema-editor__panel schema-editor__panel--info">
    {value ? (
      <dl class="schema-editor__meta">
        <div>
          <dt>제목</dt>
          <dd>{value.meta?.title ?? '제목 없음'}</dd>
        </div>
        <div>
          <dt>섹션</dt>
          <dd>{value.meta?.sectionLabel ?? value.meta?.section ?? '미지정'}</dd>
        </div>
        <div>
          <dt>디자인 서피스</dt>
          <dd>{value.meta?.designSurfaceLabel ?? value.meta?.designSurface ?? '미지정'}</dd>
        </div>
        <div>
          <dt>설명</dt>
          <dd>{value.meta?.description ?? '설명 없음'}</dd>
        </div>
      </dl>
    ) : (
      <p class="schema-editor__empty">선택된 섹션이 없습니다.</p>
    )}
  </aside>
);
