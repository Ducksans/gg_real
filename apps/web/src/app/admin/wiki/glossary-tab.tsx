/**
 * file: apps/web/src/app/admin/wiki/glossary-tab.tsx
 * owner: duksan
 * created: 2025-09-26 02:48 UTC / 2025-09-26 11:48 KST
 * updated: 2025-09-27 03:07 UTC / 2025-09-27 12:07 KST
 * purpose: Glossary 학습 화면을 분할 레이아웃과 로컬 학습 도구(UI)로 렌더링
 * doc_refs: ['admin/data/wiki-glossary.json', 'admin/state/learning-log.json', 'admin/specs/wiki-glossary-learning.md']
 */

'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  FileTreePanel,
  type FileNode,
  type GlossaryTreeNode,
} from '@/components/wiki/FileTreePanel';
import { HoverPreview } from '@/components/wiki/HoverPreview';
import { BookmarkButton } from '@/components/wiki/BookmarkButton';
import { MermaidRenderer } from '@/components/wiki/MermaidRenderer';
import { SelectionQuickMenu } from '@/components/wiki/SelectionQuickMenu';
import { SidePane } from '@/components/wiki/SidePane';
import { SplitLayout } from '@/components/wiki/SplitLayout';
import { useAnnotations } from '@/hooks/useAnnotations';
import { useHoverPreview } from '@/hooks/useHoverPreview';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { useSelectionQuickMenu, type SelectionQuickMenuState } from '@/hooks/useSelectionQuickMenu';
import type { GlossaryTerm } from '@/lib/glossary.server';
import type { LearningLogEntry } from '@/lib/learning-log.server';
import { loadProjectResource } from './actions/resources';
import { CATEGORY_LABELS } from './components/glossary/constants';
import { MainPaneContent } from './components/glossary/MainPaneContent';
import { PreviewPane } from './components/glossary/PreviewPane';
import type {
  LearningEntryMap,
  LearningNote,
  LocalLearningEntry,
  OutlineSection,
  PreviewPayload,
  ViewerState,
} from './components/glossary/types';

const LOCAL_LEARNING_KEY = 'wiki:learning:local';
const LOCAL_DRAFT_KEY = 'wiki:drafts';

const DEFAULT_PANE_WIDTHS = {
  left: 280,
  preview: 360,
  rail: 320,
};

const DEFAULT_MIN_WIDTH = 220;
const DEFAULT_MAX_WIDTH = 640;

const TOC_SCROLL_MARGIN = 80;
const LAYOUT_VIEWPORT_OFFSET = 176;
const THEME_STORAGE_KEY = 'wiki:theme-preference';

type PaneState = {
  left: boolean;
  preview: boolean;
  rail: boolean;
};

type PaneWidths = {
  left: number;
  preview: number;
  rail: number;
};

type GlossaryTabProps = {
  terms: GlossaryTerm[];
  learningEntries: LearningEntryMap;
  initialSplit?: boolean;
  fileTree?: FileNode[];
};

type PaneSelection = 'main' | 'preview';

type MainMode = 'term' | 'resource';

type PreviewMode = 'empty' | 'term' | 'resource';

export function GlossaryTab({
  terms,
  learningEntries,
  initialSplit = false,
  fileTree = [],
}: GlossaryTabProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'single' | 'split'>(initialSplit ? 'split' : 'single');
  const [panes, setPanes] = useState<PaneState>({
    left: true,
    preview: initialSplit,
    rail: true,
  });
  const [widths, setWidths] = useState<PaneWidths>(DEFAULT_PANE_WIDTHS);
  const [activePane, setActivePane] = useState<PaneSelection>('main');

  const [mainMode, setMainMode] = useState<MainMode>('term');
  const [selectedTermId, setSelectedTermId] = useState<string | null>(() =>
    terms.length ? terms[0].id : null,
  );
  const [mainResourceState, setMainResourceState] = useState<ViewerState>({ status: 'idle' });

  const [previewMode, setPreviewMode] = useState<PreviewMode>('empty');
  const [previewTermId, setPreviewTermId] = useState<string | null>(null);
  const [previewResourceState, setPreviewResourceState] = useState<ViewerState>({ status: 'idle' });

  const [mainResourcePath, setMainResourcePath] = useState<string | null>(null);
  const [previewResourcePath, setPreviewResourcePath] = useState<string | null>(null);

  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [localLearning, setLocalLearning] = useState<Record<string, LocalLearningEntry>>(() =>
    loadLocalLearning(),
  );

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const [isMainPending, startMainTransition] = useTransition();
  const [isPreviewPending, startPreviewTransition] = useTransition();

  const contentRef = useRef<HTMLDivElement | null>(null);
  const { state: quickMenuState, close: closeQuickMenu } = useSelectionQuickMenu();

  const currentMainTerm = useMemo(
    () =>
      mainMode === 'term' && selectedTermId
        ? (terms.find((t) => t.id === selectedTermId) ?? null)
        : null,
    [mainMode, selectedTermId, terms],
  );
  const previewTerm = useMemo(
    () =>
      previewMode === 'term' && previewTermId
        ? (terms.find((t) => t.id === previewTermId) ?? null)
        : null,
    [previewMode, previewTermId, terms],
  );

  const mainContentKey = useMemo(() => {
    if (mainMode === 'term') {
      return selectedTermId ?? '';
    }
    if (mainMode === 'resource' && mainResourceState.status === 'ready') {
      return mainResourceState.target.path;
    }
    return '';
  }, [mainMode, mainResourceState, selectedTermId]);

  const { annotations, addFromSelection, updateAnnotation, removeAnnotation } = useAnnotations(
    mainContentKey,
    () => contentRef.current,
  );

  const {
    preview,
    open: openHoverPreview,
    close: closeHoverPreview,
  } = useHoverPreview<PreviewPayload>(async (refId) => {
    const term = terms.find((item) => item.id === refId);
    if (term) {
      return { type: 'term', term };
    }
    return { type: 'doc', path: refId };
  });

  const glossaryTree = useMemo<GlossaryTreeNode[]>(() => buildGlossaryTree(terms), [terms]);

  const mainResourceKey = useMemo(() => {
    if (mainMode === 'resource') {
      if (mainResourceState.status === 'ready') {
        return mainResourceState.target.path;
      }
      return mainResourcePath;
    }
    return null;
  }, [mainMode, mainResourcePath, mainResourceState]);

  const readingProgressKey = mainMode === 'term' ? (selectedTermId ?? '') : (mainResourceKey ?? '');

  const readingProgress = useReadingProgress(readingProgressKey, {
    headingsSelector:
      'article h3, article h2, article h4, div[data-content-root] h2, div[data-content-root] h3',
    autoScroll: true,
  });

  const mainLearningState = useMemo(() => {
    if (mainMode === 'term' && currentMainTerm) {
      return mergeLearningState(
        learningEntries[currentMainTerm.id],
        localLearning[currentMainTerm.id],
      );
    }
    if (mainMode === 'resource' && mainResourceKey) {
      return mergeLearningState(undefined, localLearning[mainResourceKey]);
    }
    return null;
  }, [currentMainTerm, learningEntries, localLearning, mainMode, mainResourceKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (mode === 'split') {
      params.set('split', '1');
    } else {
      params.delete('split');
    }
    const search = params.toString();
    router.replace(search ? `?${search}` : '.', { scroll: false });
  }, [mode, router]);

  useEffect(() => {
    saveLocalLearning(localLearning);
  }, [localLearning]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored);
      return;
    }
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
    if (prefersDark) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'single' ? 'split' : 'single'));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const keydown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        ['INPUT', 'TEXTAREA'].includes(event.target.tagName)
      ) {
        return;
      }
      if (event.metaKey || event.ctrlKey) return;
      switch (event.key) {
        case 's':
        case 'S':
          event.preventDefault();
          toggleMode();
          break;
        case '[':
          event.preventDefault();
          setPanes((prev) => ({ ...prev, left: !prev.left }));
          break;
        case ']':
          event.preventDefault();
          setPanes((prev) => ({ ...prev, rail: !prev.rail }));
          break;
        case 'p':
        case 'P':
          if (mode === 'split') {
            event.preventDefault();
            setPanes((prev) => ({ ...prev, preview: !prev.preview }));
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [mode, toggleMode]);

  const ensureSplitPreview = useCallback(() => {
    setMode('split');
    setPanes((prev) => ({ ...prev, preview: true }));
  }, []);

  const handleResize = useCallback((pane: keyof PaneWidths, width: number) => {
    setWidths((prev) => ({ ...prev, [pane]: clamp(width, DEFAULT_MIN_WIDTH, DEFAULT_MAX_WIDTH) }));
  }, []);

  const determineTargetPane = useCallback((): PaneSelection => {
    if (mode === 'split' && panes.preview && activePane === 'preview') {
      return 'preview';
    }
    return 'main';
  }, [activePane, mode, panes.preview]);

  const handleThemeToggle = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleDraftCapture = useCallback((draft: { doc: string; kind: string; text: string }) => {
    if (typeof window === 'undefined') return;
    try {
      const existing = window.localStorage.getItem(LOCAL_DRAFT_KEY);
      const list = existing ? (JSON.parse(existing) as unknown[]) : [];
      list.push({ ...draft, id: `draft-${Date.now()}`, createdAt: new Date().toISOString() });
      window.localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(list));
    } catch (error) {
      console.warn('draft capture failed', error);
    }
  }, []);

  const handleToggleFollowUp = useCallback((key: string, baseEntry?: LearningLogEntry) => {
    if (!key) return;
    setLocalLearning((prev) => {
      const baseState = mergeLearningState(baseEntry, prev[key]);
      const current = prev[key] ?? {};
      const nextNeeds = !baseState.needsFollowup;
      return {
        ...prev,
        [key]: {
          ...current,
          needsFollowup: nextNeeds,
        },
      };
    });
  }, []);

  const handleAppendNote = useCallback((key: string, content: string) => {
    const trimmed = content.trim();
    if (!trimmed || !key) return;
    const note: LearningNote = {
      content: trimmed,
      timestamp: formatDualTimestamp(new Date()),
    };
    setLocalLearning((prev) => {
      const current = prev[key] ?? {};
      const notes = [...(current.notes ?? []), note];
      return { ...prev, [key]: { ...current, notes } };
    });
    setNoteDrafts((prev) => ({ ...prev, [key]: '' }));
  }, []);

  const selectTermInPane = useCallback(
    (pane: PaneSelection, termId: string) => {
      if (pane === 'preview') {
        ensureSplitPreview();
        setPreviewMode('term');
        setPreviewTermId(termId);
        setPreviewResourceState({ status: 'idle' });
        setPreviewResourcePath(null);
        setActivePane('preview');
      } else {
        setMainMode('term');
        setSelectedTermId(termId);
        setMainResourceState({ status: 'idle' });
        setMainResourcePath(null);
        setActivePane('main');
      }
    },
    [ensureSplitPreview],
  );

  const handleSelectTerm = useCallback(
    (termId: string) => {
      const targetPane = determineTargetPane();
      selectTermInPane(targetPane, termId);
    },
    [determineTargetPane, selectTermInPane],
  );

  const loadResourceIntoPane = useCallback(
    (pane: PaneSelection, target: ViewerTarget) => {
      if (pane === 'preview') {
        ensureSplitPreview();
        setPreviewMode('resource');
        setPreviewResourcePath(target.path);
        setPreviewResourceState({ status: 'loading', target });
        startPreviewTransition(async () => {
          try {
            const resource = await loadProjectResource(target.path);
            setPreviewResourceState({
              status: 'ready',
              target,
              kind: resource.kind,
              content: resource.content,
              frontmatter: resource.frontmatter,
            });
          } catch (error) {
            setPreviewResourceState({
              status: 'error',
              target,
              message:
                error instanceof Error ? error.message : '파일을 불러오는 중 문제가 발생했습니다.',
            });
          }
        });
        setActivePane('preview');
      } else {
        setMainMode('resource');
        setMainResourcePath(target.path);
        setMainResourceState({ status: 'loading', target });
        startMainTransition(async () => {
          try {
            const resource = await loadProjectResource(target.path);
            setMainResourceState({
              status: 'ready',
              target,
              kind: resource.kind,
              content: resource.content,
              frontmatter: resource.frontmatter,
            });
          } catch (error) {
            setMainResourceState({
              status: 'error',
              target,
              message:
                error instanceof Error ? error.message : '파일을 불러오는 중 문제가 발생했습니다.',
            });
          }
        });
        setActivePane('main');
      }
    },
    [ensureSplitPreview, startMainTransition, startPreviewTransition],
  );

  const handleOpenResource = useCallback(
    (path: string, source: ViewerTarget['source']) => {
      const targetPane = determineTargetPane();
      const name = path.split('/').pop() ?? path;
      loadResourceIntoPane(targetPane, { source, path, name });
    },
    [determineTargetPane, loadResourceIntoPane],
  );

  const handleOpenFileNode = useCallback(
    (node: FileNode) => {
      if (node.type === 'file') {
        handleOpenResource(node.path, 'file');
      }
    },
    [handleOpenResource],
  );

  const handleOpenDocument = useCallback(
    (docPath: string) => {
      handleOpenResource(docPath, 'doc');
    },
    [handleOpenResource],
  );

  const handleOpenFilePath = useCallback(
    (filePath: string) => {
      handleOpenResource(filePath, 'file');
    },
    [handleOpenResource],
  );

  const handleClearMainResource = useCallback(() => {
    setMainResourceState({ status: 'idle' });
    setMainResourcePath(null);
    setMainMode('term');
  }, []);

  const handleClearPreviewResource = useCallback(() => {
    setPreviewResourceState({ status: 'idle' });
    setPreviewResourcePath(null);
    if (previewTermId) {
      setPreviewMode('term');
    } else {
      setPreviewMode('empty');
    }
  }, [previewTermId]);

  const mainOutlineSections = useMemo<OutlineSection[]>(() => {
    if (!currentMainTerm) return [];
    return buildOutlineSections(
      currentMainTerm,
      handleOpenDocument,
      handleOpenFilePath,
      openHoverPreview,
      closeHoverPreview,
    );
  }, [
    currentMainTerm,
    handleOpenDocument,
    handleOpenFilePath,
    openHoverPreview,
    closeHoverPreview,
  ]);

  const quickMenuActions = useMemo(() => {
    const highlightActions = [
      {
        id: 'highlight-yellow',
        label: '형광펜(노랑)',
        onSelect: () => addFromSelection('yellow'),
      },
      {
        id: 'highlight-green',
        label: '형광펜(연두)',
        onSelect: () => addFromSelection('green'),
      },
      {
        id: 'highlight-blue',
        label: '형광펜(하늘)',
        onSelect: () => addFromSelection('blue'),
      },
    ];

    const noteAction = {
      id: 'note',
      label: '메모',
      onSelect: (state: SelectionQuickMenuState) => {
        const memo = window.prompt('메모 내용을 입력하세요', state.selectedText);
        const key = mainMode === 'term' ? selectedTermId : mainResourceKey;
        if (memo && key) {
          addFromSelection('yellow', memo);
          handleAppendNote(key, memo);
        }
      },
    };

    if (mainMode === 'term') {
      return [
        ...highlightActions,
        noteAction,
        {
          id: 'preview',
          label: '보조 패널로',
          onSelect: (state: SelectionQuickMenuState) => {
            if (!selectedTermId || !state.selectedText) return;
            ensureSplitPreview();
            setPreviewMode('resource');
            const snippetTarget: ViewerTarget = {
              source: 'doc',
              path: selectedTermId,
              name: '선택한 내용',
            };
            setPreviewResourceState({
              status: 'ready',
              target: snippetTarget,
              kind: 'text',
              content: state.selectedText.trim(),
            });
            handleDraftCapture({
              doc: selectedTermId,
              kind: 'selection',
              text: state.selectedText,
            });
            setActivePane('preview');
          },
        },
        {
          id: 'backlink',
          label: '백링크 초안',
          onSelect: (state: SelectionQuickMenuState) => {
            if (!selectedTermId) return;
            handleDraftCapture({ doc: selectedTermId, kind: 'backlink', text: state.selectedText });
            window.alert('백링크 초안이 로컬에 저장되었습니다. (M2에서 PR로 반영)');
          },
        },
        {
          id: 'term',
          label: '용어 만들기',
          onSelect: (state: SelectionQuickMenuState) => {
            const key = window.prompt(
              '새 용어 키(영문 스네이크)를 입력하세요',
              state.selectedText
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_'),
            );
            if (key) {
              handleDraftCapture({ doc: key, kind: 'term', text: state.selectedText });
              window.alert('새 용어 초안이 로컬에 저장되었습니다.');
            }
          },
        },
        {
          id: 'augment',
          label: '내용 보강 요청',
          onSelect: (state: SelectionQuickMenuState) => {
            if (!selectedTermId) return;
            handleDraftCapture({ doc: selectedTermId, kind: 'augment', text: state.selectedText });
            window.alert('보강 요청 초안이 로컬에 저장되었습니다.');
          },
        },
      ];
    }

    return [...highlightActions, noteAction];
  }, [
    addFromSelection,
    ensureSplitPreview,
    handleAppendNote,
    handleDraftCapture,
    mainMode,
    mainResourceKey,
    selectedTermId,
  ]);

  const sidePaneSections = useMemo(() => {
    if (mainMode === 'resource') {
      if (!mainResourceKey) {
        return [
          {
            title: '읽기 도구',
            content: <p className="text-xs text-slate-500">표시할 학습 정보가 없습니다.</p>,
          },
        ];
      }
      const mergedNotes = mainLearningState?.notes ?? [];
      return [
        {
          title: '열람 중인 파일',
          content: (
            <div className="space-y-2 text-xs text-slate-600">
              <p className="font-mono text-sm text-slate-700">{mainResourceKey}</p>
              <p>좌측 트리에서 다른 문서를 선택하면 이 영역이 교체됩니다.</p>
            </div>
          ),
        },
        {
          title: '학습 진행',
          content: (
            <div className="space-y-2 text-xs">
              <BookmarkButton docId={mainResourceKey} />
              {readingProgress.lastHeadingId ? (
                <p className="text-slate-500">최근 책갈피: #{readingProgress.lastHeadingId}</p>
              ) : (
                <p className="text-slate-400">책갈피를 추가해 진도를 기록하세요.</p>
              )}
              <button
                type="button"
                onClick={() => handleToggleFollowUp(mainResourceKey)}
                className={`w-full rounded-full px-3 py-1 font-semibold transition ${
                  mainLearningState?.needsFollowup
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {mainLearningState?.needsFollowup ? '추가 학습 중' : '추가 학습 목록에 담기'}
              </button>
            </div>
          ),
        },
        {
          title: '학습 메모',
          description: '메모는 로컬에 저장되어 재방문 시 유지됩니다.',
          content: (
            <div className="space-y-2 text-xs">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleAppendNote(mainResourceKey, noteDrafts[mainResourceKey] ?? '');
                }}
                className="space-y-2"
              >
                <textarea
                  className="w-full rounded border border-slate-300 px-2 py-1 focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="이 문서를 어떻게 이해했는지 기록해 보세요."
                  value={noteDrafts[mainResourceKey] ?? ''}
                  onChange={(event) =>
                    setNoteDrafts((prev) => ({ ...prev, [mainResourceKey]: event.target.value }))
                  }
                />
                <button
                  type="submit"
                  className="w-full rounded bg-blue-600 px-3 py-1 font-semibold text-white hover:bg-blue-700"
                >
                  메모 저장
                </button>
              </form>
              <ul className="space-y-2">
                {mergedNotes.length ? (
                  mergedNotes
                    .slice()
                    .reverse()
                    .map((note, index) => (
                      <li
                        key={`${mainResourceKey}-note-${index}`}
                        className="rounded bg-slate-50 p-2"
                      >
                        <p className="text-slate-700">{note.content}</p>
                        <p className="mt-1 text-[10px] uppercase text-slate-400">
                          {note.timestamp}
                        </p>
                      </li>
                    ))
                ) : (
                  <li className="text-slate-400">아직 메모가 없습니다.</li>
                )}
              </ul>
            </div>
          ),
        },
        {
          title: '내 하이라이트',
          description: '선택한 문장을 클릭해 위치로 이동합니다.',
          content: annotations.length ? (
            <ul className="space-y-2 text-xs">
              {annotations.map((annotation) => (
                <li key={annotation.id} className="rounded border border-slate-200 bg-slate-50 p-2">
                  <button
                    type="button"
                    className="text-left text-slate-700 underline decoration-dotted"
                    onClick={() => {
                      scrollToText(annotation.quote);
                      setActivePane('main');
                    }}
                  >
                    {annotation.quote}
                  </button>
                  {annotation.note ? (
                    <p className="mt-1 text-slate-500">메모: {annotation.note}</p>
                  ) : null}
                  <div className="mt-2 flex gap-2 text-[11px] uppercase text-slate-400">
                    <button
                      type="button"
                      onClick={() => {
                        const memo = window.prompt('메모 수정', annotation.note ?? '');
                        if (memo !== null) {
                          updateAnnotation(annotation.id, { note: memo });
                        }
                      }}
                    >
                      수정
                    </button>
                    <button type="button" onClick={() => removeAnnotation(annotation.id)}>
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">하이라이트가 없습니다.</p>
          ),
        },
      ];
    }

    if (!currentMainTerm) {
      return [
        {
          title: '읽기 도구',
          content: <p className="text-xs text-slate-500">표시할 학습 정보가 없습니다.</p>,
        },
      ];
    }

    const bookmarkHeading = readingProgress.lastHeadingId;
    const mergedNotes = mainLearningState?.notes ?? [];
    return [
      {
        title: '목차',
        description: '섹션을 클릭하면 해당 위치로 이동합니다.',
        content: (
          <nav className="space-y-1 text-sm">
            {mainOutlineSections.map((section) => (
              <button
                key={section.id}
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left transition hover:bg-slate-100"
                onClick={() => scrollToSection(section.id)}
              >
                <span>{section.title}</span>
                <span className="text-[11px] uppercase text-slate-400">GO</span>
              </button>
            ))}
          </nav>
        ),
      },
      {
        title: '학습 진행',
        content: (
          <div className="space-y-2 text-xs">
            {selectedTermId ? <BookmarkButton docId={selectedTermId} /> : null}
            {bookmarkHeading ? (
              <p className="text-slate-500">최근 책갈피: #{bookmarkHeading}</p>
            ) : (
              <p className="text-slate-400">책갈피를 추가해 진도를 기록하세요.</p>
            )}
            <button
              type="button"
              onClick={() =>
                currentMainTerm &&
                handleToggleFollowUp(currentMainTerm.id, learningEntries[currentMainTerm.id])
              }
              className={`w-full rounded-full px-3 py-1 font-semibold transition ${
                mainLearningState?.needsFollowup
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {mainLearningState?.needsFollowup ? '추가 학습 중' : '추가 학습 목록에 담기'}
            </button>
          </div>
        ),
      },
      {
        title: '학습 메모',
        description: '메모는 로컬에 저장되어 재방문 시 유지됩니다.',
        content: (
          <div className="space-y-2 text-xs">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!currentMainTerm) return;
                handleAppendNote(currentMainTerm.id, noteDrafts[currentMainTerm.id] ?? '');
              }}
              className="space-y-2"
            >
              <textarea
                className="w-full rounded border border-slate-300 px-2 py-1 focus:border-blue-500 focus:outline-none"
                rows={3}
                placeholder="이 용어를 어떻게 이해했는지 기록해 보세요."
                value={currentMainTerm ? (noteDrafts[currentMainTerm.id] ?? '') : ''}
                onChange={(event) =>
                  currentMainTerm &&
                  setNoteDrafts((prev) => ({ ...prev, [currentMainTerm.id]: event.target.value }))
                }
              />
              <button
                type="submit"
                className="w-full rounded bg-blue-600 px-3 py-1 font-semibold text-white hover:bg-blue-700"
              >
                메모 저장
              </button>
            </form>
            <ul className="space-y-2">
              {mergedNotes.length ? (
                mergedNotes
                  .slice()
                  .reverse()
                  .map((note, index) => (
                    <li
                      key={`${currentMainTerm.id}-note-${index}`}
                      className="rounded bg-slate-50 p-2"
                    >
                      <p className="text-slate-700">{note.content}</p>
                      <p className="mt-1 text-[10px] uppercase text-slate-400">{note.timestamp}</p>
                    </li>
                  ))
              ) : (
                <li className="text-slate-400">아직 메모가 없습니다.</li>
              )}
            </ul>
          </div>
        ),
      },
      {
        title: '내 하이라이트',
        description: '선택한 문장을 클릭해 위치로 이동합니다.',
        content: annotations.length ? (
          <ul className="space-y-2 text-xs">
            {annotations.map((annotation) => (
              <li key={annotation.id} className="rounded border border-slate-200 bg-slate-50 p-2">
                <button
                  type="button"
                  className="text-left text-slate-700 underline decoration-dotted"
                  onClick={() => {
                    scrollToText(annotation.quote);
                    setActivePane('main');
                  }}
                >
                  {annotation.quote}
                </button>
                {annotation.note ? (
                  <p className="mt-1 text-slate-500">메모: {annotation.note}</p>
                ) : null}
                <div className="mt-2 flex gap-2 text-[11px] uppercase text-slate-400">
                  <button
                    type="button"
                    onClick={() => {
                      const memo = window.prompt('메모 수정', annotation.note ?? '');
                      if (memo !== null) {
                        updateAnnotation(annotation.id, { note: memo });
                      }
                    }}
                  >
                    수정
                  </button>
                  <button type="button" onClick={() => removeAnnotation(annotation.id)}>
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-400">하이라이트가 없습니다.</p>
        ),
      },
    ];
  }, [
    annotations,
    currentMainTerm,
    handleAppendNote,
    handleToggleFollowUp,
    learningEntries,
    mainLearningState,
    mainMode,
    mainOutlineSections,
    mainResourceKey,
    noteDrafts,
    readingProgress.lastHeadingId,
    removeAnnotation,
    selectedTermId,
    updateAnnotation,
  ]);

  const activeTermIdForTree = useMemo(() => {
    if (mainMode === 'term' && selectedTermId) return selectedTermId;
    if (previewMode === 'term' && previewTermId) return previewTermId;
    return selectedTermId;
  }, [mainMode, selectedTermId, previewMode, previewTermId]);

  return (
    <div
      className={`relative flex flex-col gap-4 overflow-hidden ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'
      }`}
      style={{ minHeight: `calc(100vh - ${LAYOUT_VIEWPORT_OFFSET}px)` }}
    >
      <div className="flex-1 overflow-hidden">
        <SplitLayout
          mode={mode}
          onModeToggle={toggleMode}
          onToggleLeft={() => setPanes((prev) => ({ ...prev, left: !prev.left }))}
          onTogglePreview={() =>
            setPanes((prev) => ({
              ...prev,
              preview: mode === 'split' ? !prev.preview : prev.preview,
            }))
          }
          onToggleRail={() => setPanes((prev) => ({ ...prev, rail: !prev.rail }))}
          toolbarExtras={
            <button
              type="button"
              onClick={handleThemeToggle}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? '라이트 모드' : '다크 모드'}
            </button>
          }
          panes={{
            left: {
              title: '탐색',
              visible: panes.left,
              width: widths.left,
              minWidth: DEFAULT_MIN_WIDTH,
              maxWidth: DEFAULT_MAX_WIDTH,
              onResize: (width) => handleResize('left', width),
              content: (
                <FileTreePanel
                  fileNodes={fileTree}
                  glossaryNodes={glossaryTree}
                  activeTermId={activeTermIdForTree}
                  activeFilePath={
                    mainMode === 'resource' && mainResourceKey ? mainResourceKey : undefined
                  }
                  onSelectTerm={handleSelectTerm}
                  onSelectFile={handleOpenFileNode}
                  initialTab="glossary"
                />
              ),
            },
            preview: {
              title:
                previewMode === 'term'
                  ? (previewTerm?.title ?? '보조 본문')
                  : previewMode === 'resource' && previewResourceState.status === 'ready'
                    ? previewResourceState.target.name
                    : '보조 본문',
              visible: panes.preview,
              width: widths.preview,
              minWidth: DEFAULT_MIN_WIDTH,
              maxWidth: DEFAULT_MAX_WIDTH,
              onResize: (width) => handleResize('preview', width),
              content: (
                <PreviewPane
                  mode={previewMode}
                  term={previewTerm}
                  resourceState={previewResourceState}
                  resourceKey={
                    previewMode === 'resource'
                      ? previewResourceState.status === 'ready'
                        ? previewResourceState.target.path
                        : (previewResourcePath ?? undefined)
                      : undefined
                  }
                  isPending={isPreviewPending}
                  onClearResource={handleClearPreviewResource}
                />
              ),
            },
            rail: {
              title: '읽기 편의 기능',
              visible: panes.rail,
              width: widths.rail,
              minWidth: DEFAULT_MIN_WIDTH,
              maxWidth: DEFAULT_MAX_WIDTH,
              onResize: (width) => handleResize('rail', width),
              content: <SidePane sections={sidePaneSections} />,
            },
          }}
          main={{
            title:
              mainMode === 'term'
                ? (currentMainTerm?.title ?? '용어 본문')
                : mainResourceState.status === 'ready'
                  ? mainResourceState.target.name
                  : (mainResourceKey ?? '본문'),
            content: (
              <MainPaneContent
                mode={mainMode}
                term={currentMainTerm}
                annotations={annotations}
                contentRef={contentRef}
                outlineSections={mainOutlineSections}
                resourceState={mainResourceState}
                resourceKey={mainResourceKey}
                isPending={isMainPending}
                onClearResource={handleClearMainResource}
              />
            ),
          }}
          activePane={activePane}
          onActivatePane={(pane) => {
            if (pane === 'main' || pane === 'preview') {
              setActivePane(pane);
            }
          }}
        />
      </div>

      <SelectionQuickMenu
        state={quickMenuState}
        actions={quickMenuActions}
        onRequestClose={closeQuickMenu}
      />

      {mainMode === 'term' ? (
        <HoverPreview
          preview={preview}
          onClose={closeHoverPreview}
          renderContent={(data, loading, error) => {
            if (loading) return <p className="text-xs text-slate-500">불러오는 중...</p>;
            if (error)
              return <p className="text-xs text-red-600">미리보기를 불러오지 못했습니다.</p>;
            if (!data) return <p className="text-xs text-slate-400">미리보기 자료가 없습니다.</p>;
            if (data.type === 'term') {
              return (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-900">{data.term.title}</h4>
                  <p className="text-xs text-slate-500">{data.term.definition}</p>
                  <button
                    type="button"
                    className="text-xs text-blue-600 underline"
                    onClick={() => {
                      selectTermInPane(determineTargetPane(), data.term.id);
                      closeHoverPreview();
                    }}
                  >
                    이 용어로 이동
                  </button>
                </div>
              );
            }
            return (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-900">관련 문서</h4>
                <p className="text-xs text-slate-500">{data.path}</p>
                <button
                  type="button"
                  className="text-xs text-blue-600 underline"
                  onClick={() => window.open(data.path, '_blank')}
                >
                  새 창에서 열기
                </button>
              </div>
            );
          }}
        />
      ) : null}
    </div>
  );
}

function buildGlossaryTree(terms: GlossaryTerm[]): GlossaryTreeNode[] {
  const groups = new Map<string, GlossaryTreeNode>();
  terms.forEach((term) => {
    const categories =
      term.categories && term.categories.length > 0 ? term.categories : ['uncategorized'];
    const categoryKey = categories[0];
    if (!groups.has(categoryKey)) {
      groups.set(categoryKey, {
        id: `category-${categoryKey}`,
        label: CATEGORY_LABELS[categoryKey] ?? categoryKey,
        termCount: 0,
        depth: 0,
        children: [],
        terms: [],
      });
    }
    const node = groups.get(categoryKey)!;
    node.termCount += 1;
    node.terms.push({ id: term.id, title: term.title, badge: term.tags?.[0] });
  });
  return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label, 'ko'));
}

function buildOutlineSections(
  term: GlossaryTerm,
  onOpenDoc: (path: string) => void,
  onOpenCode: (path: string) => void,
  openPreview: (refId: string, rect: DOMRect | null) => void,
  closePreview: () => void,
): OutlineSection[] {
  const sections: OutlineSection[] = [];

  if (term.beginner_explanation) {
    sections.push({
      id: `${term.id}-beginner`,
      title: '초보 설명',
      content: <p>{term.beginner_explanation}</p>,
    });
  }

  const examples = normalizeToArray(term.example ?? (term.examples as unknown));
  if (examples.length) {
    sections.push({
      id: `${term.id}-examples`,
      title: '예시',
      content: examples.map((item, index) => (
        <ExampleBlock key={`${term.id}-ex-${index}`} value={item} />
      )),
    });
  }

  if (term.related_docs && term.related_docs.length) {
    sections.push({
      id: `${term.id}-docs`,
      title: '관련 문서',
      content: (
        <ul className="space-y-1">
          {term.related_docs.map((doc) => (
            <li key={doc}>
              <button
                type="button"
                className="underline decoration-dotted hover:text-blue-600"
                data-preview-ref={doc}
                onMouseEnter={(event) => {
                  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
                  openPreview(doc, rect);
                }}
                onMouseLeave={closePreview}
                onFocus={(event) => {
                  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
                  openPreview(doc, rect);
                }}
                onBlur={closePreview}
                onClick={() => onOpenDoc(doc)}
              >
                {doc}
              </button>
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (term.related_code && term.related_code.length) {
    sections.push({
      id: `${term.id}-code`,
      title: '관련 코드',
      content: (
        <ul className="space-y-1 text-xs font-mono">
          {term.related_code.map((code) => (
            <li key={code}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-1 text-left text-slate-700 hover:bg-slate-100"
                onClick={() => onOpenCode(code)}
              >
                <span className="truncate">{code}</span>
                <span className="text-[10px] uppercase text-slate-400">미리보기</span>
              </button>
            </li>
          ))}
        </ul>
      ),
    });
  }

  const suggested = normalizeToArray(term.suggested_next as unknown);
  if (suggested.length) {
    sections.push({
      id: `${term.id}-suggested`,
      title: '함께 보면 좋은 용어',
      content: (
        <ul className="flex flex-wrap gap-2 text-xs">
          {suggested.map((item) => (
            <li key={item}>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{item}</span>
            </li>
          ))}
        </ul>
      ),
    });
  }

  return sections;
}

function normalizeToArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
  }
  if (typeof value === 'string') {
    return value.trim() ? [value.trim()] : [];
  }
  return [];
}

function ExampleBlock({ value }: { value: string }) {
  if (value.trim().startsWith('```mermaid')) {
    const code = value.replace('```mermaid', '').replace(/```$/, '');
    return <MermaidRenderer code={code.trim()} />;
  }
  if (value.trim().startsWith('```')) {
    const code = value.replace(/```[a-zA-Z]*/g, '').replace(/```$/, '');
    return (
      <pre className="whitespace-pre-wrap rounded border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700">
        {code.trim()}
      </pre>
    );
  }
  return <p>{value}</p>;
}

function loadLocalLearning(): Record<string, LocalLearningEntry> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = window.localStorage.getItem(LOCAL_LEARNING_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as Record<string, LocalLearningEntry>;
    return parsed ?? {};
  } catch (error) {
    console.warn('failed to load local learning state', error);
    return {};
  }
}

function saveLocalLearning(state: Record<string, LocalLearningEntry>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_LEARNING_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('failed to persist local learning state', error);
  }
}

function mergeLearningState(
  base: LearningLogEntry | undefined,
  local: LocalLearningEntry | undefined,
): { needsFollowup: boolean; notes: LearningNote[] } {
  const needsFollowup = local?.needsFollowup ?? base?.needsFollowup ?? false;
  const baseNotes = base?.notes ?? [];
  const localNotes = local?.notes ?? [];
  return {
    needsFollowup,
    notes: [...baseNotes, ...localNotes],
  };
}

function formatDualTimestamp(date: Date): string {
  const utcIso = date.toISOString().replace('T', ' ').replace('Z', ' UTC');
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const kstIso = kstDate.toISOString().replace('T', ' ').replace('Z', '');
  return `${utcIso} / ${kstIso.slice(0, 19)} KST`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (element) {
    const top = element.getBoundingClientRect().top + window.scrollY - TOC_SCROLL_MARGIN;
    window.scrollTo({ top, behavior: 'smooth' });
    element.classList.add('ring-2', 'ring-blue-300');
    window.setTimeout(() => element.classList.remove('ring-2', 'ring-blue-300'), 800);
  }
}

function scrollToText(text: string) {
  const mark = Array.from(document.querySelectorAll('[data-annotation-id]')).find(
    (node) => node.textContent?.trim().startsWith(text.slice(0, 10)) ?? false,
  );
  if (mark instanceof HTMLElement) {
    const top = mark.getBoundingClientRect().top + window.scrollY - TOC_SCROLL_MARGIN;
    window.scrollTo({ top, behavior: 'smooth' });
    mark.classList.add('animate-pulse');
    window.setTimeout(() => mark.classList.remove('animate-pulse'), 800);
  }
}
