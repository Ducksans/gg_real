'use server';

/**
 * file: apps/web/src/app/admin/wiki/actions/resources.ts
 * owner: duksan
 * created: 2025-09-27 00:12 UTC / 2025-09-27 09:12 KST
 * purpose: Glossary 학습 화면에서 선택한 문서/파일을 읽기 영역으로 불러오기 위한 서버 액션
 * doc_refs: ["admin/specs/wiki-glossary-learning.md", "apps/web/src/app/admin/wiki/glossary-tab.tsx"]
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { loadMarkdown } from '@/lib/content';

const REPO_ROOT = path.join(process.cwd(), '..', '..');

export type ProjectResource = {
  kind: 'markdown' | 'text';
  path: string;
  content: string;
  frontmatter?: Record<string, unknown>;
};

export async function loadProjectResource(relativePath: string): Promise<ProjectResource> {
  if (!relativePath) {
    throw new Error('파일 경로가 필요합니다.');
  }

  const normalized = relativePath.replace(/\\/g, '/');
  const fullPath = path.join(REPO_ROOT, normalized);
  const resolved = path.resolve(fullPath);

  if (!resolved.startsWith(REPO_ROOT)) {
    throw new Error('허용되지 않은 경로입니다.');
  }

  if (/\.(md|mdx)$/i.test(normalized)) {
    const doc = await loadMarkdown(normalized);
    return {
      kind: 'markdown',
      path: normalized,
      content: doc.content,
      frontmatter: doc.data,
    };
  }

  const buffer = await fs.readFile(resolved, 'utf8');
  return {
    kind: 'text',
    path: normalized,
    content: buffer,
  };
}
