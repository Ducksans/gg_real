// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { useMemo } from 'preact/hooks';
import type { SchemaDocument } from '../../../schema';
import { EditorPanel } from './EditorPanel';
import { ReadonlyPanel } from './ReadonlyPanel';

interface SchemaEditorProps {
  readonly documents: SchemaDocument[];
}

export const SchemaEditor = ({ documents }: SchemaEditorProps) => {
  const pretty = useMemo(
    () => (documents.length ? JSON.stringify(documents, null, 2) : '// 선택된 섹션이 없습니다.'),
    [documents],
  );

  return (
    <div class="schema-editor">
      <header class="schema-editor__header">
        <h3>Schema Preview</h3>
        <span class="schema-editor__badge">{documents.length} docs</span>
      </header>
      <div class="schema-editor__panes">
        <EditorPanel value={pretty} />
        <ReadonlyPanel value={documents[0] ?? null} />
      </div>
    </div>
  );
};
