'use server';

/**
 * file: apps/web/src/app/admin/wiki/actions.ts
 * owner: duksan
 * created: 2025-09-24 08:12 UTC / 2025-09-24 17:12 KST
 * updated: 2025-09-24 08:12 UTC / 2025-09-24 17:12 KST
 * purpose: 서버 액션으로 관리자 문서 저장을 처리하고 frontmatter updated를 갱신
 * doc_refs: ["admin/runbooks/editing.md", "scripts/edit_flow.js", "apps/web/src/lib/content.ts", "basesettings.md", "apps/web/src/app/admin/wiki/editable-docs.ts"]
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { revalidatePath } from 'next/cache';
import { clearDocumentCache } from '@/lib/content';
import { editableDocs } from './editable-docs';

type SaveDocumentParams = {
  path: string;
  content: string;
};

const ALLOWED_DOCUMENTS = new Set<string>(editableDocs.map((doc) => doc.path));
const repoRoot = path.join(process.cwd(), '..', '..');

export async function saveDocument(params: SaveDocumentParams) {
  const { path: relativePath, content } = params;
  if (!ALLOWED_DOCUMENTS.has(relativePath)) {
    throw new Error('허용되지 않은 문서 경로입니다.');
  }
  const fullPath = path.join(repoRoot, relativePath);
  const raw = await fs.readFile(fullPath, 'utf8');
  const parsed = matter(raw);

  parsed.content = content;
  parsed.data = {
    ...parsed.data,
    updated: buildUpdatedTimestamp(),
  };

  const output = matter.stringify(parsed.content, parsed.data);
  await fs.writeFile(fullPath, output, 'utf8');

  clearDocumentCache();
  revalidatePath('/admin/wiki');
  revalidatePath('/admin');

  return {
    success: true as const,
    updated: parsed.data.updated as string,
  };
}

function buildUpdatedTimestamp(): string {
  const now = new Date();
  const utc = formatDate(now);
  const kst = formatDate(new Date(now.getTime() + 9 * 60 * 60 * 1000));
  return `${utc} UTC / ${kst} KST`;
}

function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}
