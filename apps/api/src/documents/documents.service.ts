/**
 * file: apps/api/src/documents/documents.service.ts
 * owner: duksan
 * created: 2025-09-23 03:35 UTC / 2025-09-23 12:35 KST
 * updated: 2025-09-23 04:16 UTC / 2025-09-23 13:16 KST
 * purpose: 파일 시스템 기반 문서를 로드하고 검색 결과를 반환하는 서비스
 * doc_refs: ["basesettings.md", "admin/plan/m1-kickoff.md", "apps/api/README.md"]
 */

import path from 'node:path';
import { Injectable } from '@nestjs/common';
import {
  DocumentRepository,
  searchDocuments,
  listDocuments,
  calculateDocumentStats,
  type DocumentListParams,
  type DocumentListResponse,
  type DocumentRecord,
  type DocumentSearchParams,
  type DocumentSearchResponse,
  type DocumentStats,
} from '@gg-real/documents';

const INCLUDE_GLOBS = ['*.md', 'admin/**/*.md', 'docs/**/*.md'];

@Injectable()
export class DocumentsService {
  private readonly repository: DocumentRepository;

  constructor() {
    const repoRoot = path.resolve(process.cwd(), '..', '..');
    this.repository = new DocumentRepository({
      rootDir: repoRoot,
      includeGlobs: INCLUDE_GLOBS,
    });
  }

  async search(params: DocumentSearchParams): Promise<DocumentSearchResponse> {
    const documents = await this.repository.getAllDocuments();
    return searchDocuments(documents, params);
  }

  async list(params: DocumentListParams): Promise<DocumentListResponse> {
    const documents = await this.repository.getAllDocuments();
    return listDocuments(documents, params);
  }

  async stats(): Promise<DocumentStats> {
    const documents = await this.repository.getAllDocuments();
    return calculateDocumentStats(documents);
  }

  async listAll(): Promise<DocumentRecord[]> {
    return this.repository.getAllDocuments();
  }
}
