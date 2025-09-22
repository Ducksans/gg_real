/**
 * file: apps/web/src/lib/content.ts
 * owner: duksan
 * created: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * updated: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * purpose: 관리자 페이지에서 문서/JSON 샘플 데이터를 읽어오는 헬퍼
 * doc_refs: ["basesettings.md"]
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const repoRoot = path.join(process.cwd(), '..', '..');

export type MarkdownDoc = {
  data: Record<string, unknown>;
  content: string;
};

export async function loadMarkdown(relativePath: string): Promise<MarkdownDoc> {
  const fullPath = path.join(repoRoot, relativePath);
  const raw = await fs.readFile(fullPath, 'utf8');
  const { data, content } = matter(raw);
  return { data, content };
}

export async function loadJson<T>(relativePath: string): Promise<T> {
  const fullPath = path.join(repoRoot, relativePath);
  const raw = await fs.readFile(fullPath, 'utf8');
  return JSON.parse(raw) as T;
}
