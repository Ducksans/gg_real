/**
 * file: packages/documents/src/list.ts
 * owner: duksan
 * created: 2025-09-23 04:15 UTC / 2025-09-23 13:15 KST
 * updated: 2025-09-23 04:15 UTC / 2025-09-23 13:15 KST
 * purpose: 문서 목록 필터링과 통계 계산 유틸리티 제공
 * doc_refs: ["basesettings.md", "admin/plan/m1-kickoff.md"]
 */

import path from 'node:path';
import type {
  DocumentListParams,
  DocumentListResponse,
  DocumentRecord,
  DocumentStats,
  DocumentSummary,
} from './types.js';

export function listDocuments(
  documents: DocumentRecord[],
  params: DocumentListParams = {},
): DocumentListResponse {
  const tags = normalizeArray(params.tags);
  const statuses = normalizeArray(params.status);

  const filtered = documents.filter((doc) => {
    const docTags = (doc.frontmatter.tags ?? []).map((tag) => tag.toLowerCase());
    const docStatus = (doc.frontmatter.status ?? '').toLowerCase();

    const matchesTags = tags.every((tag) => docTags.includes(tag));
    const matchesStatus = statuses.length === 0 || statuses.includes(docStatus);

    return matchesTags && matchesStatus;
  });

  filtered.sort((a, b) => parseUpdated(b) - parseUpdated(a));

  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  const slice = filtered.slice(offset, offset + limit);

  const results: DocumentSummary[] = slice.map((doc) => ({
    path: doc.frontmatter.file ?? doc.path,
    title: doc.frontmatter.title ?? deriveTitle(doc.path),
    description: doc.frontmatter.description,
    tags: (doc.frontmatter.tags ?? []).map(String),
    status: doc.frontmatter.status as string | undefined,
    updated: doc.frontmatter.updated as string | undefined,
  }));

  return {
    total: filtered.length,
    limit,
    offset,
    results,
  };
}

export function calculateDocumentStats(documents: DocumentRecord[]): DocumentStats {
  const byStatus = new Map<string, number>();
  const byTag = new Map<string, number>();

  for (const doc of documents) {
    const status = (doc.frontmatter.status ?? 'unknown').toLowerCase();
    byStatus.set(status, (byStatus.get(status) ?? 0) + 1);

    for (const tag of doc.frontmatter.tags ?? []) {
      const normalized = tag.toLowerCase();
      byTag.set(normalized, (byTag.get(normalized) ?? 0) + 1);
    }
  }

  return {
    total: documents.length,
    byStatus: Object.fromEntries(byStatus),
    byTag: Object.fromEntries(byTag),
  };
}

function normalizeArray(values?: string[]): string[] {
  if (!values || values.length === 0) {
    return [];
  }
  return values.map((value) => value.trim().toLowerCase()).filter((value) => value.length > 0);
}

function parseUpdated(doc: DocumentRecord): number {
  const updated = doc.frontmatter.updated;
  if (!updated) {
    return 0;
  }
  const match = updated.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/);
  if (!match) {
    return 0;
  }
  const iso = `${match[1]}T${match[2]}:00Z`;
  const timestamp = Date.parse(iso);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function deriveTitle(filePath: string): string {
  const basename = path.basename(filePath, path.extname(filePath));
  return basename.replace(/[-_]/g, ' ');
}
