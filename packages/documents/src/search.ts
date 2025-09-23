/**
 * file: packages/documents/src/search.ts
 * owner: duksan
 * created: 2025-09-23 03:31 UTC / 2025-09-23 12:31 KST
 * updated: 2025-09-23 03:32 UTC / 2025-09-23 12:32 KST
 * purpose: 문서 목록에 대한 키워드 검색과 백링크 계산 로직을 제공
 * doc_refs: ["basesettings.md", "admin/plan/m1-kickoff.md"]
 */

import path from 'node:path';
import type {
  DocumentRecord,
  DocumentSearchParams,
  DocumentSearchMatch,
  DocumentSearchResponse,
} from './types.js';

export function searchDocuments(
  documents: DocumentRecord[],
  params: DocumentSearchParams = {},
): DocumentSearchResponse {
  const query = (params.query ?? '').trim();
  const tokens = tokenize(query);
  const tagFilters = params.tags?.map((tag) => tag.toLowerCase()) ?? [];
  const backlinks = buildBacklinkMap(documents);

  const matches: DocumentSearchMatch[] = [];

  for (const doc of documents) {
    const tags = (doc.frontmatter.tags ?? []).map((tag) => tag.toLowerCase());

    if (!tagFilters.every((tag) => tags.includes(tag))) {
      continue;
    }

    const score = computeScore(doc, tokens);

    if (tokens.length > 0 && score === 0) {
      continue;
    }

    const snippet = createSnippet(doc.content, tokens);
    const result: DocumentSearchMatch = {
      path: doc.frontmatter.file ?? doc.path,
      title: doc.frontmatter.title ?? doc.path,
      description: doc.frontmatter.description,
      tags: doc.frontmatter.tags ?? [],
      status: doc.frontmatter.status,
      updated: doc.frontmatter.updated,
      score,
      snippet,
      backlinks: backlinks.get(doc.frontmatter.file ?? doc.path) ?? [],
    };

    matches.push(result);
  }

  matches.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return parseUtcTimestamp(b.updated) - parseUtcTimestamp(a.updated);
  });

  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  const paginated = matches.slice(offset, offset + limit);

  return {
    query,
    tags: params.tags ?? [],
    total: matches.length,
    limit,
    offset,
    results: paginated,
  };
}

function computeScore(doc: DocumentRecord, tokens: string[]): number {
  if (tokens.length === 0) {
    return 1;
  }

  const title = (doc.frontmatter.title ?? '').toLowerCase();
  const description = (doc.frontmatter.description ?? '').toLowerCase();
  const tags = (doc.frontmatter.tags ?? []).map((tag) => tag.toLowerCase());
  const content = doc.content.toLowerCase();

  let score = 0;

  for (const token of tokens) {
    if (title.includes(token)) {
      score += 5;
    }
    if (description.includes(token)) {
      score += 3;
    }
    if (tags.some((tag) => tag.includes(token))) {
      score += 2;
    }

    const occurrences = countOccurrences(content, token);
    if (occurrences > 0) {
      score += Math.min(occurrences, 3);
    }
  }

  return score;
}

function createSnippet(content: string, tokens: string[]): string {
  const plain = content.replace(/\s+/g, ' ').trim();

  if (plain.length === 0) {
    return '';
  }

  if (tokens.length === 0) {
    return plain.slice(0, 160);
  }

  const lower = plain.toLowerCase();
  for (const token of tokens) {
    const index = lower.indexOf(token);
    if (index !== -1) {
      const start = Math.max(index - 60, 0);
      const end = Math.min(index + 100, plain.length);
      const prefix = start > 0 ? '…' : '';
      const suffix = end < plain.length ? '…' : '';
      return `${prefix}${plain.slice(start, end)}${suffix}`;
    }
  }

  return plain.slice(0, 160);
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

function countOccurrences(text: string, token: string): number {
  let occurrences = 0;
  let index = text.indexOf(token);
  while (index !== -1) {
    occurrences += 1;
    index = text.indexOf(token, index + token.length);
  }
  return occurrences;
}

function parseUtcTimestamp(value?: string): number {
  if (!value) {
    return 0;
  }
  const match = value.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/);
  if (!match) {
    return 0;
  }
  const iso = `${match[1]}T${match[2]}:00Z`;
  const timestamp = Date.parse(iso);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function buildBacklinkMap(documents: DocumentRecord[]): Map<string, string[]> {
  const backlinks = new Map<string, Set<string>>();

  for (const doc of documents) {
    const references = doc.frontmatter.doc_refs ?? [];
    const sourcePath = doc.frontmatter.file ?? doc.path;

    for (const ref of references) {
      const normalized = normalizePath(ref);
      if (!backlinks.has(normalized)) {
        backlinks.set(normalized, new Set());
      }
      backlinks.get(normalized)!.add(sourcePath);
    }
  }

  const result = new Map<string, string[]>();
  for (const [key, value] of backlinks.entries()) {
    result.set(key, Array.from(value).sort());
  }
  return result;
}

function normalizePath(relativePath: string): string {
  return relativePath.split(path.sep).join(path.posix.sep);
}
