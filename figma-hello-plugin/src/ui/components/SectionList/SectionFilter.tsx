// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';

export interface SectionFilterProps {
  readonly onFilterChange: (value: string) => void;
  readonly placeholder?: string;
}

export const SectionFilter = ({ onFilterChange, placeholder }: SectionFilterProps) => {
  const query = useSignal('');

  useEffect(() => {
    onFilterChange(query.value);
  }, [query.value, onFilterChange]);

  return (
    <div class="section-filter">
      <input
        class="section-filter__input"
        type="search"
        value={query.value}
        onInput={(event) => {
          const target = event.currentTarget as HTMLInputElement;
          query.value = target.value;
        }}
        placeholder={placeholder ?? '섹션 검색'}
        aria-label="섹션 검색"
      />
    </div>
  );
};
