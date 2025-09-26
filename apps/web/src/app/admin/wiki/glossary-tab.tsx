/**
 * file: apps/web/src/app/admin/wiki/glossary-tab.tsx
 * owner: duksan
 * created: 2025-09-26 02:48 UTC / 2025-09-26 11:48 KST
 * purpose: 글로서리 용어 카드와 학습 동작을 제공하는 클라이언트 컴포넌트
 * doc_refs: ['admin/data/wiki-glossary.json', 'admin/state/learning-log.json']
 */

'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { GlossaryTerm } from '@/lib/glossary.server';
import type { LearningLogEntry } from '@/lib/learning-log.server';
import { appendTermNote, recordTermView, toggleTermFollowUp } from './actions/learning-log';

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

export function GlossaryTab({ terms, learningEntries }: GlossaryTabProps) {
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
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const highlightedIdRef = useRef<string | null>(null);
  const highlightTimerRef = useRef<number | null>(null);
  const [agentHintVisible, setAgentHintVisible] = useState(false);
  const agentHintTimerRef = useRef<number | null>(null);

  const highlightSection = useCallback((targetId: string) => {
    const element = document.getElementById(targetId);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const previous = highlightedIdRef.current;
    if (previous && previous !== targetId) {
      const prevElement = document.getElementById(previous);
      prevElement?.classList.remove('glossary-highlight');
    }

    highlightedIdRef.current = targetId;
    element.classList.add('glossary-highlight');

    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current);
    }

    highlightTimerRef.current = window.setTimeout(() => {
      element.classList.remove('glossary-highlight');
      if (highlightedIdRef.current === targetId) {
        highlightedIdRef.current = null;
      }
      highlightTimerRef.current = null;
    }, 1600);
  }, []);

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
    setOpenNodes((previous) => {
      let changed = false;
      const next = { ...previous };
      categoryTree.forEach((node) => {
        changed = markMissingOpen(node, next, previous) || changed;
      });
      return changed ? next : previous;
    });
  }, [categoryTree]);

  useEffect(() => {
    return () => {
      if (agentHintTimerRef.current) {
        window.clearTimeout(agentHintTimerRef.current);
      }
    };
  }, []);

  const selectedTerm = selectedTermId
    ? (terms.find((term) => term.id === selectedTermId) ?? null)
    : null;
  const selectedEntry = selectedTerm ? learningEntries[selectedTerm.id] : undefined;

  const handleSelectTerm = (termId: string) => {
    if (termId === selectedTermId) return;
    if (!terms.some((term) => term.id === termId)) return;
    setSelectedTermId(termId);
    startTransition(async () => {
      await recordTermView(termId);
      router.refresh();
    });
  };

  const handleToggleFollowUp = (termId: string, next: boolean) => {
    startTransition(async () => {
      await toggleTermFollowUp({ termId, needsFollowup: next });
      router.refresh();
    });
  };

  const handleSubmitNote = (termId: string) => {
    const draft = noteDrafts[termId]?.trim();
    if (!draft) return;
    startTransition(async () => {
      await appendTermNote({ termId, content: draft });
      setNoteDrafts((prev) => ({ ...prev, [termId]: '' }));
      router.refresh();
    });
  };

  const toggleNode = (path: string) => {
    setOpenNodes((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleAgentAssist = () => {
    setAgentHintVisible(true);
    if (agentHintTimerRef.current) {
      window.clearTimeout(agentHintTimerRef.current);
    }
    agentHintTimerRef.current = window.setTimeout(() => {
      setAgentHintVisible(false);
      agentHintTimerRef.current = null;
    }, 4000);
  };

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

  const sections: OutlineSection[] = [];
  sections.push({
    id: 'definition',
    label: '정의',
    content: (
      <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-700">
        {selectedTerm.definition}
      </p>
    ),
  });

  if (selectedTerm.beginner_explanation) {
    sections.push({
      id: 'beginners',
      label: '초보 설명',
      content: (
        <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-700">
          {selectedTerm.beginner_explanation}
        </p>
      ),
    });
  }

  if (selectedTerm.example) {
    sections.push({
      id: 'example',
      label: '예시',
      content: (
        <p className="whitespace-pre-wrap rounded bg-slate-50 p-3 text-sm text-slate-700">
          {selectedTerm.example}
        </p>
      ),
    });
  }

  if (selectedTerm.related_docs?.length) {
    sections.push({
      id: 'related-docs',
      label: '관련 문서',
      content: (
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {selectedTerm.related_docs.map((doc) => (
            <li key={`${selectedTerm.id}-doc-${doc}`}>{doc}</li>
          ))}
        </ul>
      ),
    });
  }

  if (selectedTerm.related_code?.length) {
    sections.push({
      id: 'related-code',
      label: '관련 코드',
      content: (
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {selectedTerm.related_code.map((code) => (
            <li key={`${selectedTerm.id}-code-${code}`}>{code}</li>
          ))}
        </ul>
      ),
    });
  }

  const viewHistory = selectedEntry?.viewHistory ?? [];
  if (viewHistory.length) {
    const historyItems = [...viewHistory].slice(-5).reverse();
    sections.push({
      id: 'history',
      label: '열람 기록',
      content: (
        <ul className="space-y-1 text-sm text-slate-600">
          {historyItems.map((timestamp, index) => (
            <li
              key={`${selectedTerm.id}-history-${index}`}
              className="rounded bg-slate-50 px-3 py-2"
            >
              {timestamp}
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (selectedTerm.suggested_next?.length) {
    sections.push({
      id: 'suggested',
      label: '다음 추천 학습',
      content: (
        <div className="flex flex-wrap gap-2">
          {selectedTerm.suggested_next.map((suggestion) => (
            <button
              key={`${selectedTerm.id}-suggest-${suggestion}`}
              type="button"
              className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
              onClick={() => handleSelectTerm(suggestion)}
              disabled={isPending}
            >
              #{suggestion}
            </button>
          ))}
        </div>
      ),
    });
  }

  const tocItems = sections.map((section) => ({ id: section.id, label: section.label }));
  tocItems.push({ id: 'notes', label: '내 메모' });

  const noteDraft = noteDrafts[selectedTerm.id] ?? '';

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)_15rem]">
      <aside>
        <div className="sticky top-20 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900">용어 카테고리</h3>
            <p className="text-xs text-slate-500">
              왼쪽에서 관심 있는 영역을 펼치고 용어를 선택하면, 오른쪽에서 한 편의 글처럼 읽을 수
              있습니다.
            </p>
          </div>
          <CategoryTree
            nodes={categoryTree}
            openNodes={openNodes}
            selectedTermId={selectedTermId}
            onToggleNode={toggleNode}
            onSelectTerm={handleSelectTerm}
            isPending={isPending}
          />
        </div>
      </aside>
      <div className="min-w-0">
        <article className="mx-auto max-w-3xl space-y-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
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
              <div className="space-y-2 text-right text-xs text-slate-500">
                <button
                  type="button"
                  className={`w-full rounded-full px-4 py-2 text-sm font-semibold transition lg:w-auto ${
                    selectedEntry?.needsFollowup
                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                  onClick={() =>
                    handleToggleFollowUp(selectedTerm.id, !selectedEntry?.needsFollowup)
                  }
                  disabled={isPending}
                >
                  {selectedEntry?.needsFollowup ? '추가 학습 중' : '추가 학습 목록에 담기'}
                </button>
                <dl className="space-y-1 text-left">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-500">마지막 열람</dt>
                    <dd className="font-medium text-slate-700">
                      {selectedEntry?.lastViewed ?? '기록 없음'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-500">열람 횟수</dt>
                    <dd className="font-medium text-slate-700">
                      {selectedEntry?.viewHistory.length ?? 0}회
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            <nav className="flex flex-wrap gap-2 text-xs lg:hidden" aria-label="용어 섹션 목차">
              {tocItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => highlightSection(item.id)}
                  className="rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-600 hover:bg-slate-100"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </header>

          {sections.map((section) => (
            <section key={section.id} id={section.id} className="space-y-2">
              <h4 className="text-lg font-semibold text-slate-900">{section.label}</h4>
              {section.content}
            </section>
          ))}

          <section id="notes" className="space-y-3">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">내 메모</h4>
                <p className="text-sm text-slate-500">
                  읽으며 떠오른 이해나 질문을 간단히 기록하면, 나중에 복습할 때 큰 도움이 됩니다.
                </p>
              </div>
              <span className="text-xs uppercase text-slate-400">
                보관 {selectedEntry?.notes.length ?? 0}건
              </span>
            </header>
            {selectedEntry?.notes.length ? (
              <ul className="space-y-2">
                {[...selectedEntry.notes]
                  .slice()
                  .reverse()
                  .map((note, index) => (
                    <li
                      key={`${selectedTerm.id}-note-${index}`}
                      className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{note.content}</p>
                      <p className="mt-2 text-[11px] uppercase text-slate-400">{note.timestamp}</p>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="rounded border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                아직 기록된 메모가 없습니다. 이해한 내용을 자신의 말로 정리해 보세요.
              </p>
            )}
            <div className="space-y-2">
              <label className="sr-only" htmlFor={`note-${selectedTerm.id}`}>
                메모 추가
              </label>
              <textarea
                id={`note-${selectedTerm.id}`}
                className="min-h-[90px] w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                placeholder="이 용어를 어떻게 이해했는지, 더 궁금한 점은 무엇인지 기록해 보세요."
                value={noteDraft}
                onChange={(event) =>
                  setNoteDrafts((prev) => ({ ...prev, [selectedTerm.id]: event.target.value }))
                }
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  onClick={() => handleSubmitNote(selectedTerm.id)}
                  disabled={isPending}
                >
                  메모 저장
                </button>
              </div>
            </div>
          </section>
        </article>
      </div>
      <aside className="hidden lg:block">
        <div className="sticky top-20 space-y-4 rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900">읽기 편의 기능</h3>
            <p className="text-xs text-slate-500">
              본문을 스크롤해도 항상 보이는 빠른 이동·행동 버튼입니다.
            </p>
          </div>
          <button
            type="button"
            className={`w-full rounded-full px-4 py-2 text-sm font-semibold transition ${
              selectedEntry?.needsFollowup
                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            onClick={() => handleToggleFollowUp(selectedTerm.id, !selectedEntry?.needsFollowup)}
            disabled={isPending}
          >
            {selectedEntry?.needsFollowup ? '추가 학습 중' : '추가 학습 목록에 담기'}
          </button>
          <button
            type="button"
            className="w-full rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            onClick={handleAgentAssist}
            disabled={isPending}
          >
            에이전트에게 내용 보충 요청
          </button>
          {agentHintVisible && (
            <div className="space-y-2 rounded-md border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
              <p className="font-semibold">준비 중인 자동 보강 기능</p>
              <p>
                GPT-5 에이전트가 정의·비유·예시를 초안으로 채워 넣도록 연결할 예정입니다. 버튼을
                눌러 요청하면 초안 → 검수 → 반영 순서로 진행되도록 설계하고 있어요.
              </p>
            </div>
          )}
          <nav aria-label="본문 섹션 빠른 이동" className="space-y-1">
            {tocItems.map((item) => (
              <button
                key={`sticky-${item.id}`}
                type="button"
                onClick={() => highlightSection(item.id)}
                className="block w-full rounded border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>
    </div>
  );
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

function markMissingOpen(
  node: CategoryTreeNode,
  next: Record<string, boolean>,
  previous: Record<string, boolean>,
): boolean {
  let changed = false;
  if (!(node.path in previous)) {
    next[node.path] = node.depth === 0;
    changed = true;
  }
  node.children.forEach((child) => {
    if (markMissingOpen(child, next, previous)) {
      changed = true;
    }
  });
  return changed;
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
            className={`text-xs transition-transform ${
              canToggle ? (isOpen ? 'rotate-90' : '') : 'opacity-30'
            }`}
          >
            {canToggle ? '▸' : '•'}
          </span>
          <span>{node.label}</span>
        </button>
        <span className="text-xs text-slate-400">{node.termCount}</span>
      </div>
      {isOpen && (
        <div className="space-y-1">
          {node.children.length > 0 && (
            <ul className="space-y-1">
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
            </ul>
          )}
          {node.terms.length > 0 && (
            <ul className="space-y-1" style={{ paddingLeft: `${(node.depth + 1) * 12}px` }}>
              {node.terms.map((term) => {
                const remainingCategories = (
                  term.categories.length ? term.categories : [UNCATEGORIZED]
                )
                  .slice(node.depth + 1)
                  .map((category) => labelForCategory(category))
                  .filter(Boolean)
                  .join(' / ');
                return (
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
                      {remainingCategories && (
                        <span className="text-xs text-slate-400">{remainingCategories}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
