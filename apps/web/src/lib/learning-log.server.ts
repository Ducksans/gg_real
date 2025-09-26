/**
 * file: apps/web/src/lib/learning-log.server.ts
 * owner: duksan
 * created: 2025-09-26 02:46 UTC / 2025-09-26 11:46 KST
 * purpose: 학습 로그 JSON을 로드/저장하고 엔트리를 보조하는 서버 유틸리티
 * doc_refs: ['admin/state/learning-log.json', 'basesettings.md']
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const LOG_RELATIVE_PATH = 'admin/state/learning-log.json';

export type LearningLogNote = {
  timestamp: string;
  content: string;
};

export type LearningLogEntry = {
  term: string;
  lastViewed?: string;
  viewHistory: string[];
  notes: LearningLogNote[];
  needsFollowup?: boolean;
};

export type LearningLog = {
  schemaVersion: number;
  owner?: string;
  description?: string;
  entries: LearningLogEntry[];
};

function learningLogPath(): string {
  const repoRoot = path.join(process.cwd(), '..', '..');
  return path.join(repoRoot, LOG_RELATIVE_PATH);
}

export async function loadLearningLog(): Promise<LearningLog> {
  const filePath = learningLogPath();
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as LearningLog;
    return normalizeLearningLog(parsed);
  } catch {
    return normalizeLearningLog({ schemaVersion: 1, entries: [] });
  }
}

function normalizeLearningLog(log: LearningLog): LearningLog {
  const entries = Array.isArray(log.entries) ? log.entries : [];
  return {
    schemaVersion: Number.isFinite(log.schemaVersion) ? log.schemaVersion : 1,
    owner: log.owner,
    description: log.description,
    entries: entries.map((entry) => ({
      term: entry.term,
      lastViewed: entry.lastViewed,
      viewHistory: Array.isArray(entry.viewHistory) ? entry.viewHistory : [],
      notes: Array.isArray(entry.notes) ? entry.notes : [],
      needsFollowup: entry.needsFollowup ?? false,
    })),
  };
}

export async function writeLearningLog(log: LearningLog): Promise<void> {
  const filePath = learningLogPath();
  const payload = `${JSON.stringify(log, null, 2)}\n`;
  await fs.writeFile(filePath, payload, 'utf8');
}

export function ensureEntry(log: LearningLog, termId: string): LearningLogEntry {
  const existing = log.entries.find((entry) => entry.term === termId);
  if (existing) {
    if (!Array.isArray(existing.viewHistory)) {
      existing.viewHistory = [];
    }
    if (!Array.isArray(existing.notes)) {
      existing.notes = [];
    }
    return existing;
  }

  const fresh: LearningLogEntry = {
    term: termId,
    viewHistory: [],
    notes: [],
    needsFollowup: false,
  };
  log.entries.push(fresh);
  return fresh;
}

export function formatTimestamp(now: Date): string {
  const utc = formatDate(now);
  const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const kst = formatDate(kstDate);
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
