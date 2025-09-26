'use client';

import { useMemo, useState } from 'react';

export type FileNode = {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
};

type FileTreePanelProps = {
  nodes: FileNode[];
  onSelect: (node: FileNode) => void;
};

export function FileTreePanel({ nodes, onSelect }: FileTreePanelProps) {
  const initialState = useMemo(() => buildDefaultOpenState(nodes), [nodes]);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(initialState);

  const toggle = (path: string) => {
    setOpenMap((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <div className="space-y-2 text-sm text-slate-700">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        프로젝트 파일
      </h3>
      <ul className="space-y-1">
        {nodes.map((node) => (
          <FileNodeRow
            key={node.path}
            node={node}
            openMap={openMap}
            onToggle={toggle}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </div>
  );
}

function buildDefaultOpenState(nodes: FileNode[], acc: Record<string, boolean> = {}) {
  nodes.forEach((node) => {
    if (node.type === 'directory') {
      acc[node.path] = true;
      if (node.children) {
        buildDefaultOpenState(node.children, acc);
      }
    }
  });
  return acc;
}

type FileNodeRowProps = {
  node: FileNode;
  openMap: Record<string, boolean>;
  onToggle: (path: string) => void;
  onSelect: (node: FileNode) => void;
  depth?: number;
};

function FileNodeRow({ node, openMap, onToggle, onSelect, depth = 0 }: FileNodeRowProps) {
  if (node.type === 'directory') {
    const isOpen = openMap[node.path] ?? false;
    return (
      <li>
        <button
          type="button"
          onClick={() => onToggle(node.path)}
          className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-slate-100"
          style={{ paddingLeft: `${depth * 12}px` }}
        >
          <span className="text-xs text-slate-400">{isOpen ? '▼' : '▶'}</span>
          <span className="font-medium text-slate-700">{node.name}</span>
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
              />
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(node)}
        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-slate-100"
        style={{ paddingLeft: `${depth * 12 + 16}px` }}
      >
        <span className="text-xs text-slate-400">•</span>
        <span className="truncate text-slate-700">{node.name}</span>
      </button>
    </li>
  );
}
