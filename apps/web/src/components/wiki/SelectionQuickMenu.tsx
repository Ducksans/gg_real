'use client';

import { SelectionQuickMenuState } from '@/hooks/useSelectionQuickMenu';

type QuickMenuAction = {
  id: string;
  label: string;
  onSelect: (state: SelectionQuickMenuState) => void;
  disabled?: boolean;
};

type SelectionQuickMenuProps = {
  state: SelectionQuickMenuState;
  actions: QuickMenuAction[];
  onRequestClose: () => void;
};

export function SelectionQuickMenu({ state, actions, onRequestClose }: SelectionQuickMenuProps) {
  if (!state.isOpen || !state.position) {
    return null;
  }

  return (
    <div
      className="absolute z-50 -translate-x-1/2 rounded-full border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
      style={{ top: state.position.top - 40, left: state.position.left }}
    >
      <div className="flex items-center divide-x divide-slate-200 text-xs text-slate-600 dark:divide-slate-700 dark:text-slate-200">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => {
              action.onSelect(state);
              onRequestClose();
            }}
            disabled={action.disabled}
            className="px-3 py-1 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400 dark:hover:bg-slate-800 dark:disabled:text-slate-500"
          >
            {action.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onRequestClose}
          className="px-3 py-1 text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          aria-label="닫기"
        >
          ×
        </button>
      </div>
    </div>
  );
}
