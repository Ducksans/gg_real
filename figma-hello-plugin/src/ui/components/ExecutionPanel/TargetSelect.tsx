// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import type { TargetMode, TargetStore } from '../../store/targetStore';

interface TargetSelectProps {
  readonly targetStore: TargetStore;
}

const TARGET_MODE_LABELS: Record<TargetMode, string> = {
  append: 'Append (기존 유지)',
  replace: 'Replace (완전 교체)',
  update: 'Update (차이만 적용)',
};

export const TargetSelect = ({ targetStore }: TargetSelectProps) => {
  const { pages, currentPage, selectedPage, frameName, mode } = targetStore.state.value;

  const handlePageChange = (event: Event) => {
    const nextPage = (event.currentTarget as HTMLInputElement).value;
    targetStore.selectPage(nextPage === '__current__' ? undefined : nextPage);
  };

  const handleFrameChange = (event: Event) => {
    targetStore.setFrameName((event.currentTarget as HTMLInputElement).value);
  };

  const handleModeChange = (event: Event) => {
    targetStore.selectMode((event.currentTarget as HTMLSelectElement).value as TargetMode);
  };

  const resolveCheckedValue = () => {
    if (!selectedPage || selectedPage === currentPage) {
      return '__current__';
    }
    return selectedPage;
  };

  return (
    <div class="target-select">
      <h3 class="target-select__title">대상 페이지 설정</h3>
      {pages.length ? (
        <ul class="target-select__list">
          <li class="target-select__item">
            <label>
              <input
                type="radio"
                name="target-page"
                value="__current__"
                checked={resolveCheckedValue() === '__current__'}
                onChange={handlePageChange}
              />
              현재 페이지 사용 ({currentPage ?? '미확인'})
            </label>
          </li>
          {pages.map((page) => (
            <li class="target-select__item" key={page}>
              <label>
                <input
                  type="radio"
                  name="target-page"
                  value={page}
                  checked={resolveCheckedValue() === page}
                  onChange={handlePageChange}
                />
                {page}
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p class="target-select__empty">페이지 정보를 불러오는 중입니다.</p>
      )}
      <button
        type="button"
        class="target-select__clear"
        onClick={() => targetStore.selectPage(undefined)}
        disabled={!selectedPage}
      >
        페이지 선택 해제
      </button>
      <div class="target-select__controls">
        <label class="target-select__control">
          <span>프레임 이름</span>
          <input
            type="text"
            value={frameName}
            onInput={handleFrameChange}
            placeholder="GeneratedFrame"
          />
        </label>
        <label class="target-select__control">
          <span>적용 모드</span>
          <select value={mode} onChange={handleModeChange}>
            {Object.entries(TARGET_MODE_LABELS).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};
