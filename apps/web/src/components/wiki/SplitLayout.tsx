import { type ReactNode, useMemo } from 'react';

type PaneId = 'left' | 'main' | 'preview' | 'rail';

type ResizablePaneConfig = {
  title: string;
  visible: boolean;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  content: ReactNode;
  onResize: (width: number) => void;
};

type MainPaneConfig = {
  title: string;
  content: ReactNode;
};

type SplitLayoutProps = {
  mode: 'single' | 'split';
  onModeToggle: () => void;
  onToggleLeft: () => void;
  onTogglePreview: () => void;
  onToggleRail: () => void;
  panes: {
    left: ResizablePaneConfig;
    preview: ResizablePaneConfig;
    rail: ResizablePaneConfig;
  };
  main: MainPaneConfig;
  activePane: PaneId;
  onActivatePane: (pane: PaneId) => void;
  toolbarExtras?: React.ReactNode;
};

const DEFAULT_MIN = 200;
const DEFAULT_MAX = 600;

export function SplitLayout({
  mode,
  onModeToggle,
  onToggleLeft,
  onTogglePreview,
  onToggleRail,
  panes,
  main,
  activePane,
  onActivatePane,
  toolbarExtras,
}: SplitLayoutProps) {
  const layoutDescription =
    mode === 'split'
      ? '분할 보기: 본문과 보조 패널을 나란히 보면서 학습 도구를 즉시 사용할 수 있습니다.'
      : '단일 보기: 본문을 넓게 보고 필요할 때 패널을 펼칩니다.';

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        <span>{layoutDescription}</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onModeToggle}
            className={`rounded-full border px-3 py-1 font-medium transition ${
              mode === 'split'
                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                : 'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {mode === 'split' ? '분할 보기 해제 (S)' : '분할 보기 (S)'}
          </button>
          <button
            type="button"
            onClick={onToggleLeft}
            className={`rounded-full border px-3 py-1 transition ${
              panes.left.visible
                ? 'border-slate-900 bg-white text-slate-900 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                : 'border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            좌측 패널 ([)
          </button>
          <button
            type="button"
            onClick={onTogglePreview}
            disabled={mode !== 'split'}
            className={`rounded-full border px-3 py-1 transition ${
              panes.preview.visible && mode === 'split'
                ? 'border-slate-900 bg-white text-slate-900 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                : 'border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700'
            } ${mode !== 'split' ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            보조 패널 (P)
          </button>
          <button
            type="button"
            onClick={onToggleRail}
            className={`rounded-full border px-3 py-1 transition ${
              panes.rail.visible
                ? 'border-slate-900 bg-white text-slate-900 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                : 'border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            우측 레일 (])
          </button>
          {toolbarExtras}
        </div>
      </div>
      <div className="relative flex min-h-[70vh] flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {panes.left.visible ? (
          <Pane
            id="left"
            config={panes.left}
            active={activePane === 'left'}
            onActivate={onActivatePane}
            resizePosition="right"
          />
        ) : null}
        <MainPane title={main.title} active={activePane === 'main'} onActivate={onActivatePane}>
          {main.content}
        </MainPane>
        {mode === 'split' && panes.preview.visible ? (
          <Pane
            id="preview"
            config={panes.preview}
            active={activePane === 'preview'}
            onActivate={onActivatePane}
            resizePosition="left"
          />
        ) : null}
        {panes.rail.visible ? (
          <Pane
            id="rail"
            config={panes.rail}
            active={activePane === 'rail'}
            onActivate={onActivatePane}
            resizePosition="left"
          />
        ) : null}
      </div>
    </div>
  );
}

type PaneProps = {
  id: PaneId;
  config: ResizablePaneConfig;
  active: boolean;
  onActivate: (pane: PaneId) => void;
  resizePosition: 'left' | 'right';
};

function Pane({ id, config, active, onActivate, resizePosition }: PaneProps) {
  const { title, visible, content, width, minWidth, maxWidth, onResize } = config;
  const clampedMin = minWidth ?? DEFAULT_MIN;
  const clampedMax = maxWidth ?? DEFAULT_MAX;
  const style = useMemo(() => ({ flexBasis: `${width}px`, width: `${width}px` }), [width]);

  if (!visible) {
    return null;
  }

  return (
    <div className="flex">
      {resizePosition === 'left' ? (
        <ResizeHandle
          ariaLabel={`${title} 폭 조절`}
          initialWidth={width}
          minWidth={clampedMin}
          maxWidth={clampedMax}
          onResize={onResize}
          orientation="left"
        />
      ) : null}
      <section
        tabIndex={0}
        aria-label={title}
        className={`flex h-full flex-col overflow-hidden border-slate-200 bg-white transition focus:outline-none dark:border-slate-700 dark:bg-slate-900 ${
          active
            ? 'border-l-0 border-r-0 ring-2 ring-blue-400 dark:ring-blue-300'
            : 'border-l border-r'
        }`}
        style={style}
        onFocus={() => onActivate(id)}
        onMouseDown={() => onActivate(id)}
        data-active={active}
      >
        <header className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {title}
        </header>
        <div className="flex-1 overflow-auto px-4 py-3 text-[15px] leading-relaxed text-slate-800 dark:text-slate-200">
          {content}
        </div>
      </section>
      {resizePosition === 'right' ? (
        <ResizeHandle
          ariaLabel={`${title} 폭 조절`}
          initialWidth={width}
          minWidth={clampedMin}
          maxWidth={clampedMax}
          onResize={onResize}
          orientation="right"
        />
      ) : null}
    </div>
  );
}

type MainPaneProps = {
  title: string;
  active: boolean;
  onActivate: (pane: PaneId) => void;
  children: React.ReactNode;
};

function MainPane({ title, active, onActivate, children }: MainPaneProps) {
  return (
    <section
      tabIndex={0}
      aria-label={title}
      className={`flex min-w-0 flex-1 flex-col border-slate-200 bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 ${
        active ? 'ring-2 ring-blue-400 dark:ring-blue-300' : 'border-r'
      }`}
      onFocus={() => onActivate('main')}
      onMouseDown={() => onActivate('main')}
    >
      <header className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        {title}
      </header>
      <div className="flex-1 overflow-auto px-6 py-4 text-base leading-relaxed text-slate-900 dark:text-slate-100">
        {children}
      </div>
    </section>
  );
}
type ResizeHandleProps = {
  ariaLabel: string;
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
  onResize: (width: number) => void;
  orientation: 'left' | 'right';
};

function ResizeHandle({
  ariaLabel,
  initialWidth,
  minWidth,
  maxWidth,
  onResize,
  orientation,
}: ResizeHandleProps) {
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = initialWidth;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startX;
      const next =
        orientation === 'right'
          ? clamp(startWidth + delta, minWidth, maxWidth)
          : clamp(startWidth - delta, minWidth, maxWidth);
      onResize(next);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-label={ariaLabel}
      className="flex w-2 cursor-col-resize items-center justify-center bg-slate-100 transition hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
      onPointerDown={handlePointerDown}
    >
      <span className="text-slate-400 dark:text-slate-300">⋮</span>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
