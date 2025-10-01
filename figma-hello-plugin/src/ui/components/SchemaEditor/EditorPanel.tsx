interface EditorPanelProps {
  readonly value: string;
}

export const EditorPanel = ({ value }: EditorPanelProps) => (
  <div class="schema-editor__panel schema-editor__panel--editor">
    <textarea
      class="schema-editor__textarea"
      value={value}
      readOnly
      spellcheck={false}
      aria-label="선택된 섹션 스키마 미리보기"
    />
  </div>
);
