/**
 * file: apps/web/src/lib/content.ts
 * owner: duksan
 * created: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * updated: 2025-09-23 04:16 UTC / 2025-09-23 13:16 KST
 * purpose: 관리자 페이지에서 문서/JSON 샘플 데이터를 읽어오는 헬퍼
 * doc_refs: ["basesettings.md"]
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import {
  DocumentRepository,
  searchDocuments as runDocumentSearch,
  listDocuments as runDocumentList,
  calculateDocumentStats,
  type DocumentFrontmatter,
  type DocumentListParams,
  type DocumentListResponse,
  type DocumentRecord,
  type DocumentSearchParams,
  type DocumentSearchResponse,
  type DocumentStats,
} from '@gg-real/documents';

const repoRoot = path.join(process.cwd(), '..', '..');
const repository = new DocumentRepository({ rootDir: repoRoot });

export type MarkdownDoc = {
  data: DocumentFrontmatter;
  content: string;
};

export async function loadMarkdown(relativePath: string): Promise<MarkdownDoc> {
  const { frontmatter, content } = await repository.loadDocument(relativePath);
  return { data: frontmatter, content };
}

export async function loadJson<T>(relativePath: string): Promise<T> {
  const fullPath = path.join(repoRoot, relativePath);
  const raw = await fs.readFile(fullPath, 'utf8');
  return JSON.parse(raw) as T;
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  return repository.getAllDocuments();
}

export async function searchDocuments(
  params: DocumentSearchParams,
): Promise<DocumentSearchResponse> {
  const docs = await repository.getAllDocuments();
  return runDocumentSearch(docs, params);
}

export async function listDocumentSummaries(
  params: DocumentListParams,
): Promise<DocumentListResponse> {
  const docs = await repository.getAllDocuments();
  return runDocumentList(docs, params);
}

export async function getDocumentStats(): Promise<DocumentStats> {
  const docs = await repository.getAllDocuments();
  return calculateDocumentStats(docs);
}
