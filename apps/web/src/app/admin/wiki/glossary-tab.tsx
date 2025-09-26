/**
 * file: apps/web/src/app/admin/wiki/glossary-tab.tsx
 * owner: duksan
 * created: 2025-09-26 02:48 UTC / 2025-09-26 11:48 KST
 * purpose: 글로서리 학습 화면을 분할 보기·하이라이트·파일 트리 등 확장된 UX로 렌더링
 * doc_refs: ['admin/data/wiki-glossary.json', 'admin/state/learning-log.json', 'admin/specs/wiki-glossary-learning.md']
 */

'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useAnnotations } from '@/hooks/useAnnotations';
import { useHoverPreview } from '@/hooks/useHoverPreview';
import { useSelectionQuickMenu } from '@/hooks/useSelectionQuickMenu';
import type { GlossaryTerm } from '@/lib/glossary.server';
import type { LearningLogEntry } from '@/lib/learning-log.server';
import { appendTermNote, recordTermView, toggleTermFollowUp } from './actions/learning-log';
import { loadProjectResource } from './actions/resources';
import { MarkdownContent } from '@/components/MarkdownContent';
import { AnnotationLayer } from '@/components/wiki/AnnotationLayer';
import { BookmarkButton } from '@/components/wiki/BookmarkButton';
import { FileTreePanel, type FileNode } from '@/components/wiki/FileTreePanel';
import { HoverPreview as HoverPreviewCard } from '@/components/wiki/HoverPreview';
import { SelectionQuickMenu } from '@/components/wiki/SelectionQuickMenu';
import { SidePane } from '@/components/wiki/SidePane';
import { SplitLayout } from '@/components/wiki/SplitLayout';
import { MermaidRenderer } from '@/components/wiki/MermaidRenderer';

const CATEGORY_LABELS: Record<string, string> = {
  architecture: '아키텍처',
  backend: '백엔드',
  cache: '캐시/성능',
  ci: 'CI · 자동화',
  data: '데이터',
  docs: '문서',
  frontend: '프론트엔드',
  git: 'Git',
  governance: '거버넌스',
  infra: '인프라',
  observability: '관측/모니터링',
  project: '프로젝트 운영',
  realtime: '실시간/메시징',
  search: '검색/추천',
  security: '보안',
  tooling: '개발 도구',
  ui: 'UI/UX',
  visual: '시각화',
  uncategorized: '기타 용어',
};

const UNCATEGORIZED = 'uncategorized';

type LearningEntryMap = Record<string, LearningLogEntry | undefined>;

type GlossaryTabProps = {
  terms: GlossaryTerm[];
  learningEntries: LearningEntryMap;
  initialSplit?: boolean;
  fileTree?: FileNode[];
};

type CategoryTreeNode = {
  id: string;
  label: string;
  path: string;
  depth: number;
  termCount: number;
  children: CategoryTreeNode[];
  terms: GlossaryTerm[];
};

type OutlineSection = {
  id: string;
  label: string;
  content: JSX.Element;
};

type PreviewPayload =
  | { type: 'term'; term: GlossaryTerm }
  | { type: 'doc'; path: string; reason?: string };

type ViewerTarget = {
  source: 'doc' | 'file';
  path: string;
  name: string;
};

type ViewerState =
  | { status: 'idle' }
  | { status: 'loading'; target: ViewerTarget }
  | {
      status: 'ready';
      target: ViewerTarget;
      kind: 'markdown' | 'text';
      content: string;
      frontmatter?: Record<string, unknown>;
    }
  | { status: 'error'; target: ViewerTarget; message: string };

type DraftCapture = {
  id: string;
  doc: string;
  kind: 'backlink' | 'term' | 'augment';
  text: string;
  createdAt: string;
};

export function GlossaryTab({
  terms,
  learningEntries,
  initialSplit = false,
  fileTree = [],
}: GlossaryTabProps) {
  const router = useRouter();
  const categoryTree = useMemo(() => buildCategoryTree(terms), [terms]);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(() =>
    terms.length ? terms[0].id : null,
  );
  const [openNodes, setOpenNodes] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    categoryTree.forEach((node) => markDefaultOpen(node, defaults));
    return defaults;
  });
  const [isMutating, startMutation] = useTransition();
  const [splitEnabled, setSplitEnabled] = useState(initialSplit);
  const [viewerState, setViewerState] = useState<ViewerState>({ status: 'idle' });
  const [isViewerPending, startViewerTransition] = useTransition();
  const articleRef = useRef<HTMLDivElement | null>(null);
  const { state: quickMenuState, close: closeQuickMenu } = useSelectionQuickMenu();
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const { annotations, addFromSelection, updateAnnotation, removeAnnotation } = useAnnotations(
    selectedTermId ?? '',
    () => articleRef.current,
  );

  const {
    preview,
    open: openPreview,
    close: closePreview,
  } = useHoverPreview<PreviewPayload>(async (refId) => {
    const term = terms.find((t) => t.id === refId);
    if (term) {
      return { type: 'term', term };
    }
    return { type: 'doc', path: refId };
  });

  useEffect(() => {
    if (!terms.length) {
      setSelectedTermId(null);
      return;
    }
    setSelectedTermId((current) => {
      if (current && terms.some((term) => term.id === current)) {
        return current;
      }
      return terms[0].id;
    });
  }, [terms]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (splitEnabled) {
      const params = new URLSearchParams(window.location.search);
      params.set('split', '1');
      router.replace(`?${params.toString()}`, { scroll: false });
    } else {
      const params = new URLSearchParams(window.location.search);
      params.delete('split');
      router.replace(params.size ? `?${params.toString()}` : '.', { scroll: false });
    }
  }, [router, splitEnabled]);

  const selectedTerm = selectedTermId
    ? (terms.find((term) => term.id === selectedTermId) ?? null)
    : null;
  const selectedEntry = selectedTerm ? learningEntries[selectedTerm.id] : undefined;

  const handleSelectTerm = useCallback(
    (termId: string) => {
      if (termId === selectedTermId) return;
      setSelectedTermId(termId);
      startMutation(async () => {
        await recordTermView(termId);
        router.refresh();
      });
    },
    [router, selectedTermId],
  );

  const handleToggleFollowUp = useCallback(
    (termId: string, next: boolean) => {
      startMutation(async () => {
        await toggleTermFollowUp({ termId, needsFollowup: next });
        router.refresh();
      });
    },
    [router],
  );

  const handleDraftCapture = useCallback((draft: Omit<DraftCapture, 'id' | 'createdAt'>) => {
    if (typeof window === 'undefined') return;
    const payload: DraftCapture = {
      ...draft,
      id: `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    const key = 'wiki:drafts';
    const existing = window.localStorage.getItem(key);
    const list = existing ? (JSON.parse(existing) as DraftCapture[]) : [];
    window.localStorage.setItem(key, JSON.stringify([...list, payload]));
  }, []);

  const ensureSplitEnabled = useCallback(() => {
    setSplitEnabled(true);
  }, []);

  const openResource = useCallback(
    (target: ViewerTarget) => {
      ensureSplitEnabled();
      setViewerState({ status: 'loading', target });
      startViewerTransition(async () => {
        try {
          const resource = await loadProjectResource(target.path);
          setViewerState({
            status: 'ready',
            target,
            kind: resource.kind,
            content: resource.content,
            frontmatter: resource.frontmatter,
          });
        } catch (error) {
          setViewerState({
            status: 'error',
            target,
            message: error instanceof Error ? error.message : '선택한 파일을 불러오지 못했습니다.',
          });
        }
      });
    },
    [ensureSplitEnabled, startViewerTransition],
  );

  const handleOpenDocument = useCallback(
    (docPath: string) => {
      const name = docPath.split('/').pop() ?? docPath;
      handleDraftCapture({ doc: docPath, kind: 'backlink', text: 'related-doc' });
      openResource({ source: 'doc', path: docPath, name });
    },
    [handleDraftCapture, openResource],
  );

  const handleOpenFileNode = useCallback(
    (node: FileNode) => {
      handleDraftCapture({ doc: node.path, kind: 'backlink', text: 'file-select' });
      openResource({ source: 'file', path: node.path, name: node.name });
    },
    [handleDraftCapture, openResource],
  );

  const handleOpenFilePath = useCallback(
    (filePath: string) => {
      const name = filePath.split('/').pop() ?? filePath;
      handleDraftCapture({ doc: filePath, kind: 'backlink', text: 'related-code' });
      openResource({ source: 'file', path: filePath, name });
    },
    [handleDraftCapture, openResource],
  );

  const clearViewer = useCallback(() => {
    setViewerState({ status: 'idle' });
  }, []);

  const quickMenuActions = useMemo(
    () => [
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
      {
        id: 'note',
        label: '메모',
        onSelect: () => {
          const memo = window.prompt('메모 내용을 입력하세요');
          if (memo) {
            addFromSelection('yellow', memo);
          }
        },
      },
      {
        id: 'backlink',
        label: '백링크 추가',
        onSelect: (state) => {
          if (!selectedTermId) return;
          handleDraftCapture({
            doc: selectedTermId,
            kind: 'backlink',
            text: state.selectedText,
          });
          window.alert('백링크 추가가 초안으로 저장되었습니다. (M2에서 PR로 반영)');
        },
      },
      {
        id: 'term',
        label: '용어 만들기',
        onSelect: (state) => {
          const key = window.prompt(
            '새 용어 키(영문 스네이크)를 입력하세요',
            state.selectedText
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '_'),
          );
          if (key) {
            handleDraftCapture({
              doc: key,
              kind: 'term',
              text: state.selectedText,
            });
            window.alert('새 용어 초안이 저장되었습니다.');
          }
        },
      },
      {
        id: 'augment',
        label: '내용 보강 요청',
        onSelect: (state) => {
          if (!selectedTermId) return;
          handleDraftCapture({
            doc: selectedTermId,
            kind: 'augment',
            text: state.selectedText,
          });
          window.alert('내용 보강 요청 초안이 저장되었습니다.');
        },
      },
    ],
    [addFromSelection, handleDraftCapture, selectedTermId],
  );

  const sidePaneSections = useMemo(() => {
    if (!selectedTerm) {
      return [];
    }

    return [
      {
        title: '읽기 영역',
        description: '문서나 파일을 선택하면 아래에 미리보기가 표시됩니다.',
        content: (
          <ResourceViewer state={viewerState} onClear={clearViewer} isPending={isViewerPending} />
        ),
      },
      {
        title: '학습 도구',
        content: (
          <div className="space-y-2">
            <BookmarkButton docId={selectedTerm.id} />
            <button
              type="button"
              onClick={() =>
                handleToggleFollowUp(selectedTerm.id, !(selectedEntry?.needsFollowup ?? false))
              }
              className={`w-full rounded-full px-3 py-1 text-xs font-semibold transition ${
                selectedEntry?.needsFollowup
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-900 text-white'
              }`}
            >
              {selectedEntry?.needsFollowup ? '추가 학습 중' : '추가 학습 목록에 담기'}
            </button>
          </div>
        ),
      },
      {
        title: '학습 로그 메모',
        description: '메모는 학습 로그(JSON)에 append됩니다.',
        content: (
          <div className="space-y-2">
            <form
              className="space-y-2"
              onSubmit={async (event) => {
                event.preventDefault();
                const draft = noteDrafts[selectedTerm.id]?.trim();
                if (!draft) return;
                startMutation(async () => {
                  await appendTermNote({ termId: selectedTerm.id, content: draft });
                  setNoteDrafts((prev) => ({ ...prev, [selectedTerm.id]: '' }));
                  router.refresh();
                });
              }}
            >
              <textarea
                className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                placeholder="이 용어를 어떻게 이해했는지 기록해 보세요."
                rows={3}
                value={noteDrafts[selectedTerm.id] ?? ''}
                onChange={(event) =>
                  setNoteDrafts((prev) => ({ ...prev, [selectedTerm.id]: event.target.value }))
                }
              />
              <button
                type="submit"
                className="w-full rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                disabled={isMutating}
              >
                메모 저장
              </button>
            </form>
            <ul className="space-y-2 text-xs text-slate-600">
              {selectedEntry?.notes.length ? (
                selectedEntry.notes
                  .slice()
                  .reverse()
                  .map((note, index) => (
                    <li
                      key={`${selectedTerm.id}-learning-note-${index}`}
                      className="rounded bg-slate-50 p-2"
                    >
                      <p className="text-slate-700">{note.content}</p>
                      <p className="mt-1 text-[10px] uppercase text-slate-400">{note.timestamp}</p>
                    </li>
                  ))
              ) : (
                <li className="text-slate-400">학습 로그 메모가 없습니다.</li>
              )}
            </ul>
          </div>
        ),
      },
      {
        title: '관련 문서',
        content: (
          <ul className="space-y-1 text-sm text-slate-600">
            {(selectedTerm.related_docs ?? []).length ? (
              selectedTerm.related_docs?.map((doc) => (
                <li key={`doc-${doc}`}>
                  <button
                    type="button"
                    className="underline decoration-dotted hover:text-slate-900"
                    data-preview-ref={doc}
                    onMouseEnter={(event) => {
                      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
                      openPreview(doc, rect);
                    }}
                    onMouseLeave={closePreview}
                    onClick={() => {
                      closePreview();
                      handleOpenDocument(doc);
                    }}
                  >
                    {doc}
                  </button>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-400">연결된 문서가 없습니다.</li>
            )}
          </ul>
        ),
      },
      {
        title: '관련 코드',
        content: (
          <ul className="space-y-1 text-sm text-slate-600">
            {(selectedTerm.related_code ?? []).length ? (
              selectedTerm.related_code?.map((codePath) => (
                <li key={`code-${codePath}`}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-1 text-left text-xs font-mono hover:bg-slate-100"
                    onClick={() => handleOpenFilePath(codePath)}
                  >
                    <span className="truncate">{codePath}</span>
                    <span className="text-[10px] uppercase text-slate-400">미리보기</span>
                  </button>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-400">연결된 코드가 없습니다.</li>
            )}
          </ul>
        ),
      },
      {
        title: '내 메모',
        content: annotations.length ? (
          <ul className="space-y-2">
            {annotations.map((annotation) => (
              <li
                key={annotation.id}
                className="rounded border border-slate-200 bg-slate-50 p-2 text-xs"
              >
                <p className="font-medium text-slate-700">{annotation.quote}</p>
                {annotation.note ? <p className="mt-1 text-slate-500">{annotation.note}</p> : null}
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
          <p className="text-xs text-slate-400">하이라이트를 추가하면 여기에 메모가 표시됩니다.</p>
        ),
      },
    ];
  }, [
    annotations,
    clearViewer,
    closePreview,
    handleOpenDocument,
    handleOpenFilePath,
    handleToggleFollowUp,
    isMutating,
    isViewerPending,
    noteDrafts,
    openPreview,
    removeAnnotation,
    selectedEntry?.needsFollowup,
    selectedEntry?.notes,
    selectedTerm,
    updateAnnotation,
    viewerState,
    router,
  ]);

  if (!selectedTerm) {
    return (
      <div className="rounded border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        아직 등록된 용어가 없습니다. `admin/data/wiki-glossary.json`에 용어를 추가하면 이 화면에서
        학습 흐름을 읽을 수 있습니다.
      </div>
    );
  }

  const categoriesForDisplay = (
    selectedTerm.categories.length ? selectedTerm.categories : [UNCATEGORIZED]
  ).map((category) => labelForCategory(category));

  const sections: OutlineSection[] = buildSections(
    selectedTerm,
    handleOpenDocument,
    handleOpenFilePath,
  );
  const tocItems = sections.map((section) => ({ id: section.id, label: section.label }));
  tocItems.push({ id: 'notes', label: '내 메모' });

  return (
    <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
      <aside className="mb-6 space-y-6 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm lg:sticky lg:top-24 lg:h-fit lg:mb-0">
        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">용어 카테고리</h3>
          <CategoryTree
            nodes={categoryTree}
            openNodes={openNodes}
            selectedTermId={selectedTermId}
            onToggleNode={(path) => setOpenNodes((prev) => ({ ...prev, [path]: !prev[path] }))}
            onSelectTerm={handleSelectTerm}
            isPending={isMutating}
          />
        </section>
        <section>
          {fileTree.length ? (
            <FileTreePanel nodes={fileTree} onSelect={handleOpenFileNode} />
          ) : (
            <p className="text-xs text-slate-400">프로젝트 파일 트리를 불러오는 중입니다…</p>
          )}
        </section>
      </aside>
      <div className="relative space-y-6">
        <SplitLayout
          enabled={splitEnabled}
          onToggle={() => setSplitEnabled((prev) => !prev)}
          sideContent={<SidePane sections={sidePaneSections} />}
        >
          <article ref={articleRef} className="space-y-6 text-sm leading-relaxed text-slate-700">
            <header className="space-y-4 border-b border-slate-200 pb-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {categoriesForDisplay.map((category) => (
                      <span
                        key={`${selectedTerm.id}-cat-${category}`}
                        className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900">{selectedTerm.title}</h3>
                </div>
                <dl className="space-y-1 text-xs text-slate-500">
                  <div className="flex items-center justify-between gap-4">
                    <dt>마지막 열람</dt>
                    <dd className="font-medium text-slate-700">
                      {selectedEntry?.lastViewed ?? '기록 없음'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt>열람 횟수</dt>
                    <dd className="font-medium text-slate-700">
                      {selectedEntry?.viewHistory.length ?? 0}회
                    </dd>
                  </div>
                </dl>
              </div>
              <nav className="flex flex-wrap gap-2 text-xs" aria-label="용어 섹션 목차">
                {tocItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-600 hover:bg-slate-100"
                    onClick={() => {
                      const element = document.getElementById(item.id);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </header>

            <AnnotationLayer annotations={annotations}>
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="space-y-2">
                  <h4 className="text-lg font-semibold text-slate-900">{section.label}</h4>
                  {section.content}
                </section>
              ))}
            </AnnotationLayer>

            <section id="notes" className="space-y-3">
              <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">내 메모</h4>
                  <p className="text-sm text-slate-500">
                    하이라이트 영역을 클릭하거나 사이드 패널에서 메모를 관리할 수 있습니다.
                  </p>
                </div>
                <span className="text-xs uppercase text-slate-400">총 {annotations.length}건</span>
              </header>
            </section>
          </article>
        </SplitLayout>

        <SelectionQuickMenu
          state={quickMenuState}
          actions={quickMenuActions}
          onRequestClose={closeQuickMenu}
        />
        <HoverPreviewCard
          preview={preview}
          onClose={closePreview}
          renderContent={(data, loading, error) => {
            if (loading) return <p className="text-xs text-slate-500">불러오는 중...</p>;
            if (error)
              return <p className="text-xs text-red-600">미리보기 오류: {error.message}</p>;
            if (!data) return <p className="text-xs text-slate-500">미리보기 데이터가 없습니다.</p>;
            if (data.type === 'term') {
              return (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-900">{data.term.title}</h4>
                  <p className="text-xs text-slate-500">{data.term.definition}</p>
                  <button
                    type="button"
                    className="text-xs text-blue-600 underline"
                    onClick={() => {
                      setSelectedTermId(data.term.id);
                      closePreview();
                    }}
                  >
                    이 용어로 이동
                  </button>
                </div>
              );
            }
            return (
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-900">문서 미리보기</h4>
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
      </div>
    </div>
  );
}

type ResourceViewerProps = {
  state: ViewerState;
  onClear: () => void;
  isPending: boolean;
};

function ResourceViewer({ state, onClear, isPending }: ResourceViewerProps) {
  if (state.status === 'idle') {
    return (
      <p className="text-xs text-slate-500">문서나 파일을 선택하면 미리보기가 여기에 나타납니다.</p>
    );
  }

  if (state.status === 'loading' || isPending) {
    return <p className="text-xs text-slate-500">불러오는 중입니다…</p>;
  }

  if (state.status === 'error') {
    return (
      <div className="space-y-2 text-sm text-slate-600">
        <p className="text-red-600">미리보기를 불러오지 못했습니다: {state.message}</p>
        <button
          type="button"
          onClick={onClear}
          className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          초기화
        </button>
      </div>
    );
  }

  const { target, kind, content, frontmatter } = state;
  const updated = typeof frontmatter?.updated === 'string' ? frontmatter.updated : null;
  const title =
    typeof frontmatter?.title === 'string' && frontmatter.title.trim().length > 0
      ? frontmatter.title
      : target.name;

  return (
    <div className="space-y-3">
      <header className="space-y-1">
        <p className="text-[10px] uppercase text-slate-400">
          {target.source === 'doc' ? '문서' : '파일'} · {target.path}
        </p>
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
          >
            닫기
          </button>
        </div>
        {updated ? <p className="text-[11px] text-slate-500">최종 업데이트: {updated}</p> : null}
      </header>
      <div className="max-h-[360px] overflow-auto rounded border border-slate-200 bg-white p-3 text-sm text-slate-700">
        {kind === 'markdown' ? (
          <MarkdownContent content={content} />
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-700">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}

function buildSections(
  term: GlossaryTerm,
  onOpenDoc: (path: string) => void,
  onOpenFile: (path: string) => void,
): OutlineSection[] {
  const sections: OutlineSection[] = [];
  sections.push({
    id: 'definition',
    label: '정의',
    content: <p>{term.definition}</p>,
  });

  if (term.beginner_explanation) {
    sections.push({
      id: 'beginners',
      label: '초보 설명',
      content: <p>{term.beginner_explanation}</p>,
    });
  }

  if (term.example) {
    if (term.example.includes('```mermaid')) {
      const mermaidCode = term.example.replace(/```mermaid\s*([\s\S]*?)```/, '$1');
      sections.push({
        id: 'example',
        label: '예시 (다이어그램)',
        content: <MermaidRenderer code={mermaidCode} />,
      });
    } else {
      sections.push({
        id: 'example',
        label: '예시',
        content: <p>{term.example}</p>,
      });
    }
  }

  if (term.related_docs?.length) {
    sections.push({
      id: 'related-docs',
      label: '관련 문서',
      content: (
        <ul className="space-y-1 pl-4 text-sm text-slate-600">
          {term.related_docs.map((doc) => (
            <li key={`${term.id}-doc-${doc}`}>
              <button
                type="button"
                className="underline decoration-dotted hover:text-slate-900"
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

  if (term.related_code?.length) {
    sections.push({
      id: 'related-code',
      label: '관련 코드',
      content: (
        <ul className="space-y-1 pl-4 text-sm text-slate-600">
          {term.related_code.map((code) => (
            <li key={`${term.id}-code-${code}`}>
              <button
                type="button"
                className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-left text-xs font-mono hover:bg-slate-100"
                onClick={() => onOpenFile(code)}
              >
                {code}
              </button>
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (term.suggested_next?.length) {
    sections.push({
      id: 'suggested',
      label: '다음 추천 학습',
      content: (
        <div className="flex flex-wrap gap-2">
          {term.suggested_next.map((suggestion) => (
            <span
              key={suggestion}
              className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
            >
              #{suggestion}
            </span>
          ))}
        </div>
      ),
    });
  }

  return sections;
}

function labelForCategory(id: string): string {
  return CATEGORY_LABELS[id] ?? id;
}

function buildCategoryTree(terms: GlossaryTerm[]): CategoryTreeNode[] {
  const nodeMap = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  const getOrCreateNode = (path: string, id: string, depth: number): CategoryTreeNode => {
    let node = nodeMap.get(path);
    if (!node) {
      node = {
        id,
        label: labelForCategory(id),
        path,
        depth,
        termCount: 0,
        children: [],
        terms: [],
      };
      nodeMap.set(path, node);
      if (depth === 0) {
        roots.push(node);
      } else {
        const parentPath = path.split('/').slice(0, -1).join('/');
        const parent = nodeMap.get(parentPath);
        if (parent) {
          parent.children.push(node);
        }
      }
    }
    return node;
  };

  terms.forEach((term) => {
    const categories = term.categories.length ? term.categories : [UNCATEGORIZED];
    const pathParts: string[] = [];
    categories.forEach((categoryId, depth) => {
      pathParts.push(categoryId);
      const path = pathParts.join('/');
      const node = getOrCreateNode(path, categoryId, depth);
      if (depth === categories.length - 1) {
        node.terms.push(term);
      }
    });
  });

  sortTree(roots);
  return roots;
}

function sortTree(nodes: CategoryTreeNode[]): void {
  nodes.sort((a, b) => a.label.localeCompare(b.label, 'ko'));
  nodes.forEach((node) => {
    sortTree(node.children);
    node.terms.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
    const childTotal = node.children.reduce((acc, child) => acc + child.termCount, 0);
    node.termCount = node.terms.length + childTotal;
  });
}

function markDefaultOpen(node: CategoryTreeNode, openMap: Record<string, boolean>): void {
  if (!(node.path in openMap)) {
    openMap[node.path] = node.depth === 0;
  }
  node.children.forEach((child) => markDefaultOpen(child, openMap));
}

type CategoryTreeProps = {
  nodes: CategoryTreeNode[];
  openNodes: Record<string, boolean>;
  selectedTermId: string | null;
  onToggleNode: (path: string) => void;
  onSelectTerm: (termId: string) => void;
  isPending: boolean;
};

function CategoryTree({
  nodes,
  openNodes,
  selectedTermId,
  onToggleNode,
  onSelectTerm,
  isPending,
}: CategoryTreeProps) {
  if (!nodes.length) {
    return <p className="text-xs text-slate-500">표시할 카테고리가 없습니다.</p>;
  }

  return (
    <ul className="space-y-1">
      {nodes.map((node) => (
        <CategoryNodeRow
          key={node.path}
          node={node}
          openNodes={openNodes}
          selectedTermId={selectedTermId}
          onToggleNode={onToggleNode}
          onSelectTerm={onSelectTerm}
          isPending={isPending}
        />
      ))}
    </ul>
  );
}

type CategoryNodeRowProps = {
  node: CategoryTreeNode;
  openNodes: Record<string, boolean>;
  selectedTermId: string | null;
  onToggleNode: (path: string) => void;
  onSelectTerm: (termId: string) => void;
  isPending: boolean;
};

function CategoryNodeRow({
  node,
  openNodes,
  selectedTermId,
  onToggleNode,
  onSelectTerm,
  isPending,
}: CategoryNodeRowProps) {
  const isOpen = openNodes[node.path] ?? node.depth === 0;
  const hasChildren = node.children.length > 0;
  const hasTerms = node.terms.length > 0;
  const canToggle = hasChildren || hasTerms;
  const indentStyle = { paddingLeft: `${node.depth * 12}px` };

  return (
    <li>
      <div
        className={`flex items-center justify-between rounded px-2 py-1 text-sm font-medium text-slate-700 ${
          isOpen ? 'bg-white shadow-sm' : 'hover:bg-white'
        }`}
        style={indentStyle}
      >
        <button
          type="button"
          className="flex flex-1 items-center gap-2 text-left"
          onClick={() => (canToggle ? onToggleNode(node.path) : undefined)}
        >
          <span
            className={`text-xs transition-transform ${canToggle ? (isOpen ? 'rotate-90' : '') : 'opacity-30'}`}
          >
            {canToggle ? '▸' : '•'}
          </span>
          <span>{node.label}</span>
        </button>
        <span className="text-xs text-slate-400">{node.termCount}</span>
      </div>
      {isOpen && (
        <ul className="space-y-1" style={{ marginLeft: `${(node.depth + 1) * 12}px` }}>
          {node.children.map((child) => (
            <CategoryNodeRow
              key={child.path}
              node={child}
              openNodes={openNodes}
              selectedTermId={selectedTermId}
              onToggleNode={onToggleNode}
              onSelectTerm={onSelectTerm}
              isPending={isPending}
            />
          ))}
          {node.terms.map((term) => (
            <li key={term.id}>
              <button
                type="button"
                className={`flex w-full items-center justify-between rounded px-3 py-1 text-sm transition ${
                  term.id === selectedTermId
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-600 hover:bg-blue-50'
                }`}
                onClick={() => onSelectTerm(term.id)}
                disabled={isPending && term.id !== selectedTermId}
              >
                <span className="truncate">{term.title}</span>
                <span className="text-xs text-slate-400">
                  {term.categories
                    .slice(node.depth + 1)
                    .map((category) => labelForCategory(category))
                    .join(' / ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
