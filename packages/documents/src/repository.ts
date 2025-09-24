/**
 * file: packages/documents/src/repository.ts
 * owner: duksan
 * created: 2025-09-23 03:31 UTC / 2025-09-23 12:31 KST
 * updated: 2025-09-23 03:32 UTC / 2025-09-23 12:32 KST
 * purpose: 파일 시스템에 저장된 관리자 문서를 로드하고 캐싱하는 저장소를 제공
 * doc_refs: ["basesettings.md", "admin/plan/m1-kickoff.md"]
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import matter from 'gray-matter';
import type { DocumentFrontmatter, DocumentRecord } from './types.js';

export type DocumentRepositoryOptions = {
  rootDir: string;
  includeGlobs?: string[];
  excludeGlobs?: string[];
  cache?: boolean;
};

const DEFAULT_INCLUDE = ['*.md', 'admin/**/*.md'];
const DEFAULT_EXCLUDE = [
  'node_modules/**',
  'admin/checkpoints/**',
  'admin/migrations/templates/**',
  'admin/templates/**',
];

export class DocumentRepository {
  private readonly includeGlobs: string[];
  private readonly excludeGlobs: string[];
  private readonly enableCache: boolean;
  private readonly cache = new Map<string, DocumentRecord>();

  constructor(private readonly options: DocumentRepositoryOptions) {
    this.includeGlobs = options.includeGlobs ?? DEFAULT_INCLUDE;
    this.excludeGlobs = options.excludeGlobs ?? DEFAULT_EXCLUDE;
    this.enableCache = options.cache ?? true;
  }

  async listDocumentPaths(): Promise<string[]> {
    return fg(this.includeGlobs, {
      cwd: this.options.rootDir,
      ignore: this.excludeGlobs,
      onlyFiles: true,
      dot: false,
    });
  }

  async loadDocument(relativePath: string): Promise<DocumentRecord> {
    const normalizedPath = normalizePath(relativePath);

    if (this.enableCache && this.cache.has(normalizedPath)) {
      return this.cache.get(normalizedPath)!;
    }

    const fullPath = path.join(this.options.rootDir, normalizedPath);
    const raw = await fs.readFile(fullPath, 'utf8');
    const { data, content } = matter(raw);
    const frontmatter = normalizeFrontmatter(data, normalizedPath);
    const record: DocumentRecord = {
      path: normalizedPath,
      frontmatter,
      content,
    };

    if (this.enableCache) {
      this.cache.set(normalizedPath, record);
    }

    return record;
  }

  async getAllDocuments(): Promise<DocumentRecord[]> {
    const paths = await this.listDocumentPaths();
    const records = await Promise.all(paths.map((file) => this.loadDocument(file)));
    return records;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

function normalizePath(relativePath: string): string {
  return relativePath.split(path.sep).join(path.posix.sep);
}

function normalizeFrontmatter(
  data: DocumentFrontmatter,
  fallbackPath: string,
): DocumentFrontmatter {
  if (!data.file) {
    data.file = fallbackPath;
  }
  if (!data.title) {
    const basename = path.basename(fallbackPath, path.extname(fallbackPath));
    data.title = basename;
  }
  if (!data.tags) {
    data.tags = [];
  }
  return data;
}
