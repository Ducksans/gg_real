// doc_refs: ["admin/plan/figmapluginmake.md"]

import fs from 'node:fs';
import path from 'node:path';

import { validateSectionFile, validateSurfaceFile } from './validator';
import type { SectionFileRaw, SurfaceFileRaw } from './types';
import type { SectionFileEntry, SurfaceFileEntry } from './normalizer';

const ROOT = path.resolve(__dirname, '../../..', 'admin/specs/ui-archetypes');
const SURFACES_DIR = path.join(ROOT, 'surfaces');

export const loadSurfaceFiles = (): SurfaceFileEntry[] => {
  if (!fs.existsSync(SURFACES_DIR)) {
    return [];
  }

  return fs
    .readdirSync(SURFACES_DIR)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => {
      const filePath = path.join(SURFACES_DIR, file);
      const raw = fs.readFileSync(filePath, 'utf8');
      let parsed: unknown;

      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        throw new Error(`Surface JSON 파싱 실패: ${filePath} — ${(error as Error).message}`);
      }

      const surface = validateSurfaceFile(parsed, filePath);
      return { filePath, surface } satisfies SurfaceFileEntry;
    });
};

export const loadSectionFiles = (): SectionFileEntry[] => {
  if (!fs.existsSync(ROOT)) {
    throw new Error(`아키타입 디렉터리를 찾을 수 없습니다: ${ROOT}`);
  }

  const directories = fs
    .readdirSync(ROOT)
    .filter((entry) => fs.statSync(path.join(ROOT, entry)).isDirectory())
    .sort();

  const entries: SectionFileEntry[] = [];

  directories.forEach((page) => {
    const sectionsDir = path.join(ROOT, page, 'sections');
    if (!fs.existsSync(sectionsDir)) {
      return;
    }

    const files = fs
      .readdirSync(sectionsDir)
      .filter((file) => file.endsWith('.json'))
      .sort();

    files.forEach((file) => {
      const filePath = path.join(sectionsDir, file);
      const raw = fs.readFileSync(filePath, 'utf8');
      let parsed: unknown;

      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        throw new Error(`Section JSON 파싱 실패: ${filePath} — ${(error as Error).message}`);
      }

      const section = validateSectionFile(parsed, filePath);
      entries.push({ page, filePath, section, raw } satisfies SectionFileEntry);
    });
  });

  return entries;
};
