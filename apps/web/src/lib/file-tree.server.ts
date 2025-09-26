/**
 * file: apps/web/src/lib/file-tree.server.ts
 * owner: duksan
 * created: 2025-09-26 08:06 UTC / 2025-09-27 02:06 KST
 * purpose: Glossary 학습 화면에서 사용할 프로젝트 파일 트리를 생성
 * doc_refs: ['admin/specs/wiki-glossary-learning.md']
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import type { FileNode } from '@/components/wiki/FileTreePanel';

const ROOT = path.join(process.cwd(), '..', '..');
const INCLUDED_FOLDERS = ['apps', 'packages', 'admin', 'docs'];
const EXCLUDE_PATTERNS = [/\.git/, /node_modules/, /\.turbo/, /dist/, /build/];
const MAX_DEPTH = 3;
const MAX_CHILDREN = 50;

export async function loadProjectFileTree(): Promise<FileNode[]> {
  const entries = await Promise.all(
    INCLUDED_FOLDERS.map(async (folder) => {
      const fullPath = path.join(ROOT, folder);
      try {
        const stats = await fs.stat(fullPath);
        if (!stats.isDirectory()) return null;
        return buildNode(fullPath, folder, 0);
      } catch (error) {
        console.warn(`[file-tree] ${folder} 탐색 실패`, error);
        return null;
      }
    }),
  );
  return (await Promise.all(entries)).filter(Boolean) as FileNode[];
}

async function buildNode(fullPath: string, name: string, depth: number): Promise<FileNode> {
  const relativePath = path.relative(ROOT, fullPath);
  const stats = await fs.stat(fullPath);
  if (stats.isFile()) {
    return { name, path: relativePath, type: 'file' };
  }

  if (depth >= MAX_DEPTH) {
    return { name, path: relativePath, type: 'directory', children: [] };
  }

  const dirEntries = await fs.readdir(fullPath, { withFileTypes: true });
  const children: FileNode[] = [];
  for (const entry of dirEntries.slice(0, MAX_CHILDREN)) {
    if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(entry.name))) {
      continue;
    }
    try {
      const childFullPath = path.join(fullPath, entry.name);
      if (entry.isDirectory()) {
        children.push(await buildNode(childFullPath, entry.name, depth + 1));
      } else if (entry.isFile()) {
        children.push({ name: entry.name, path: path.relative(ROOT, childFullPath), type: 'file' });
      }
    } catch (error) {
      console.warn(`[file-tree] ${entry.name} 처리 실패`, error);
    }
  }
  return { name, path: relativePath, type: 'directory', children };
}
