/**
 * file: packages/documents/src/types.ts
 * owner: duksan
 * created: 2025-09-23 03:31 UTC / 2025-09-23 12:31 KST
 * updated: 2025-09-23 03:31 UTC / 2025-09-23 12:31 KST
 * purpose: 문서 메타데이터와 검색 결과에 필요한 타입 정의를 제공
 * doc_refs: ["basesettings.md", "admin/plan/m1-kickoff.md"]
 */

export type DocumentFrontmatter = {
  file?: string;
  title?: string;
  owner?: string;
  created?: string;
  updated?: string;
  status?: string;
  tags?: string[];
  description?: string;
  schemaVersion?: number;
  code_refs?: string[];
  doc_refs?: string[];
  [key: string]: unknown;
};

export type DocumentRecord = {
  path: string;
  frontmatter: DocumentFrontmatter;
  content: string;
};

export type DocumentSearchParams = {
  query?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
};

export type DocumentSearchMatch = {
  path: string;
  title: string;
  description?: string;
  tags: string[];
  status?: string;
  updated?: string;
  score: number;
  snippet: string;
  backlinks: string[];
};

export type DocumentSearchResponse = {
  query: string;
  tags: string[];
  total: number;
  limit: number;
  offset: number;
  results: DocumentSearchMatch[];
};
