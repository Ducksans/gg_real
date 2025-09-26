'use server';

/**
 * file: apps/web/src/app/admin/wiki/actions/learning-log.ts
 * owner: duksan
 * created: 2025-09-26 02:47 UTC / 2025-09-26 11:47 KST
 * purpose: 글로서리 학습 로그를 갱신하는 서버 액션 모음
 * doc_refs: ['admin/state/learning-log.json', 'basesettings.md']
 */

import { revalidatePath } from 'next/cache';
import {
  ensureEntry,
  formatTimestamp,
  loadLearningLog,
  writeLearningLog,
} from '@/lib/learning-log.server';

const REVALIDATE_PATH = '/admin/wiki';
const VIEW_HISTORY_MAX = 20;
const NOTES_MAX = 50;

export async function recordTermView(termId: string): Promise<void> {
  if (!termId) return;
  const log = await loadLearningLog();
  const entry = ensureEntry(log, termId);
  const timestamp = formatTimestamp(new Date());
  entry.lastViewed = timestamp;
  entry.viewHistory = [
    timestamp,
    ...entry.viewHistory.filter((value) => value !== timestamp),
  ].slice(0, VIEW_HISTORY_MAX);
  await writeLearningLog(log);
  revalidatePath(REVALIDATE_PATH);
}

export async function toggleTermFollowUp({
  termId,
  needsFollowup,
}: {
  termId: string;
  needsFollowup: boolean;
}): Promise<void> {
  if (!termId) return;
  const log = await loadLearningLog();
  const entry = ensureEntry(log, termId);
  entry.needsFollowup = needsFollowup;
  await writeLearningLog(log);
  revalidatePath(REVALIDATE_PATH);
}

export async function appendTermNote({
  termId,
  content,
}: {
  termId: string;
  content: string;
}): Promise<void> {
  const trimmed = content.trim();
  if (!termId || trimmed.length === 0) {
    return;
  }
  const log = await loadLearningLog();
  const entry = ensureEntry(log, termId);
  entry.notes = [
    { timestamp: formatTimestamp(new Date()), content: trimmed },
    ...entry.notes,
  ].slice(0, NOTES_MAX);
  await writeLearningLog(log);
  revalidatePath(REVALIDATE_PATH);
}
