/**
 * file: apps/web/src/lib/glossary.server.ts
 * owner: duksan
 * created: 2025-09-26 02:45 UTC / 2025-09-26 11:45 KST
 * purpose: 글로서리 데이터를 로드하고 용어 맵을 구성하는 서버 유틸리티
 * doc_refs: ['admin/data/wiki-glossary.json', 'basesettings.md']
 */

import path from 'node:path';
import { loadJson } from './content';

export type GlossaryTerm = {
  id: string;
  title: string;
  categories: string[];
  definition: string;
  beginner_explanation?: string;
  example?: string;
  related_docs?: string[];
  related_code?: string[];
  suggested_next?: string[];
};

export type GlossaryData = {
  schemaVersion: number;
  updated?: string;
  owner?: string;
  description?: string;
  terms: GlossaryTerm[];
};

const GLOSSARY_PATH = 'admin/data/wiki-glossary.json';

export async function loadGlossary(): Promise<GlossaryData> {
  const data = await loadJson<GlossaryData>(GLOSSARY_PATH);
  return {
    schemaVersion: data.schemaVersion,
    updated: data.updated,
    owner: data.owner,
    description: data.description,
    terms: Array.isArray(data.terms) ? data.terms : [],
  };
}

export function createGlossaryIndex(terms: GlossaryTerm[]): Map<string, GlossaryTerm> {
  return new Map(terms.map((term) => [term.id, term]));
}

export function glossaryFilePath(): string {
  const repoRoot = path.join(process.cwd(), '..', '..');
  return path.join(repoRoot, GLOSSARY_PATH);
}
