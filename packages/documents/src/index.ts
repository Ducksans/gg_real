/**
 * file: packages/documents/src/index.ts
 * owner: duksan
 * created: 2025-09-23 03:31 UTC / 2025-09-23 12:31 KST
 * updated: 2025-09-23 03:31 UTC / 2025-09-23 12:31 KST
 * purpose: 문서 저장소와 검색 유틸리티를 외부에 노출하는 엔트리포인트
 * doc_refs: ["basesettings.md", "admin/plan/m1-kickoff.md"]
 */

export * from './types.js';
export { DocumentRepository } from './repository.js';
export { searchDocuments } from './search.js';
