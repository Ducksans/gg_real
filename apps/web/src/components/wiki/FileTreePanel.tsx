'use client';

import { useMemo, useState } from 'react';

export type FileNode = {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
};

export type GlossaryTreeNode = {
  id: string;
  label: string;
  termCount: number;
  depth: number;
  children: GlossaryTreeNode[];
  terms: { id: string; title: string; badge?: string }[];
};

type FileTreePanelProps = {
  fileNodes: FileNode[];
  glossaryNodes: GlossaryTreeNode[];
  activeFilePath?: string | null;
  activeTermId?: string | null;
  onSelectFile: (node: FileNode) => void;
  onSelectTerm: (termId: string) => void;
  initialTab?: 'files' | 'glossary';
};

export function FileTreePanel({
  fileNodes,
  glossaryNodes,
  activeFilePath = null,
  activeTermId = null,
  onSelectFile,
  onSelectTerm,
  initialTab = 'glossary',
}: FileTreePanelProps) {
  const [tab, setTab] = useState<'files' | 'glossary'>(initialTab);
  const initialFileOpen = useMemo(() => buildFileOpenState(fileNodes), [fileNodes]);
  const initialGlossaryOpen = useMemo(() => buildGlossaryOpenState(glossaryNodes), [glossaryNodes]);
  const [fileOpenMap, setFileOpenMap] = useState<Record<string, boolean>>(initialFileOpen);
  const [glossaryOpenMap, setGlossaryOpenMap] =
    useState<Record<string, boolean>>(initialGlossaryOpen);

  const toggleFile = (path: string) => {
    setFileOpenMap((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const toggleGlossary = (id: string) => {
    setGlossaryOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex h-full flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
      <div className="flex items-center rounded-full bg-slate-100 p-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <TabButton
          id="glossary"
          label={`용어사전 (${countTerms(glossaryNodes)})`}
          isActive={tab === 'glossary'}
          onClick={() => setTab('glossary')}
        />
        <TabButton
          id="files"
          label="실제 파일"
          isActive={tab === 'files'}
          onClick={() => setTab('files')}
        />
      </div>
      <div className="flex-1 overflow-auto rounded border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        {tab === 'glossary' ? (
          <ul className="divide-y divide-slate-100">
            {glossaryNodes.map((node) => (
              <GlossaryNodeRow
                key={node.id}
                node={node}
                openMap={glossaryOpenMap}
                onToggle={toggleGlossary}
                activeTermId={activeTermId}
                onSelectTerm={onSelectTerm}
              />
            ))}
          </ul>
        ) : (
          <ul className="space-y-1 p-1">
            {fileNodes.map((node) => (
              <FileNodeRow
                key={node.path}
                node={node}
                openMap={fileOpenMap}
                onToggle={toggleFile}
                onSelect={onSelectFile}
                depth={0}
                activeFilePath={activeFilePath}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function buildFileOpenState(nodes: FileNode[], acc: Record<string, boolean> = {}, depth = 0) {
  nodes.forEach((node) => {
    if (node.type === 'directory') {
      acc[node.path] = depth < 1;
      if (node.children) {
        buildFileOpenState(node.children, acc, depth + 1);
      }
    }
  });
  return acc;
}

function buildGlossaryOpenState(nodes: GlossaryTreeNode[], acc: Record<string, boolean> = {}) {
  nodes.forEach((node) => {
    acc[node.id] = node.depth < 1;
    if (node.children.length) {
      buildGlossaryOpenState(node.children, acc);
    }
  });
  return acc;
}

type TabButtonProps = {
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
};

function TabButton({ label, isActive, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full px-3 py-1 transition ${
        isActive
          ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900'
          : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100'
      }`}
    >
      {label}
    </button>
  );
}

type FileNodeRowProps = {
  node: FileNode;
  openMap: Record<string, boolean>;
  onToggle: (path: string) => void;
  onSelect: (node: FileNode) => void;
  depth: number;
  activeFilePath?: string | null;
};

function FileNodeRow({
  node,
  openMap,
  onToggle,
  onSelect,
  depth,
  activeFilePath = null,
}: FileNodeRowProps) {
  if (node.type === 'directory') {
    const isOpen = openMap[node.path] ?? false;
    return (
      <li>
        <button
          type="button"
          onClick={() => onToggle(node.path)}
          className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
          style={{ paddingLeft: `${depth * 12}px` }}
        >
          <span className="text-xs text-slate-400">{isOpen ? '▼' : '▶'}</span>
          <span className="font-medium text-slate-700 dark:text-slate-200">{node.name}</span>
        </button>
        {isOpen && node.children && node.children.length > 0 ? (
          <ul className="space-y-1">
            {node.children.map((child) => (
              <FileNodeRow
                key={child.path}
                node={child}
                openMap={openMap}
                onToggle={onToggle}
                onSelect={onSelect}
                depth={depth + 1}
                activeFilePath={activeFilePath}
              />
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  const isActive = activeFilePath === node.path;
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(node)}
        className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left transition ${
          isActive
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        style={{ paddingLeft: `${depth * 12 + 16}px` }}
      >
        <span className="text-xs text-slate-300 dark:text-slate-500">•</span>
        <span className="truncate">{node.name}</span>
      </button>
    </li>
  );
}

type GlossaryNodeRowProps = {
  node: GlossaryTreeNode;
  openMap: Record<string, boolean>;
  onToggle: (id: string) => void;
  activeTermId?: string | null;
  onSelectTerm: (termId: string) => void;
};

function GlossaryNodeRow({
  node,
  openMap,
  onToggle,
  activeTermId = null,
  onSelectTerm,
}: GlossaryNodeRowProps) {
  const isOpen = openMap[node.id] ?? false;

  return (
    <li>
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={() => onToggle(node.id)}
          className="flex items-center gap-2 text-left text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          <span className="text-xs text-slate-400 dark:text-slate-500">{isOpen ? '▼' : '▶'}</span>
          <span>{node.label}</span>
        </button>
        <span className="text-xs text-slate-400 dark:text-slate-500">{node.termCount}</span>
      </div>
      {isOpen ? (
        <div className="space-y-1 pb-2">
          {node.terms.map((term) => {
            const isTermActive = term.id === activeTermId;
            return (
              <button
                key={term.id}
                type="button"
                onClick={() => onSelectTerm(term.id)}
                className={`flex w-full items-center justify-between gap-2 px-5 py-1 text-left text-sm transition ${
                  isTermActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="truncate">{term.title}</span>
                {term.badge ? (
                  <span className="rounded-full bg-slate-100 px-2 py-[1px] text-[10px] uppercase text-slate-500 dark:bg-slate-700 dark:text-slate-200">
                    {term.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
          {node.children.length ? (
            <ul className="border-l border-slate-100 pl-4 dark:border-slate-800">
              {node.children.map((child) => (
                <GlossaryNodeRow
                  key={child.id}
                  node={child}
                  openMap={openMap}
                  onToggle={onToggle}
                  activeTermId={activeTermId}
                  onSelectTerm={onSelectTerm}
                />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function countTerms(nodes: GlossaryTreeNode[]): number {
  return nodes.reduce((acc, node) => acc + node.termCount, 0);
}
