/**
 * file: apps/web/src/app/admin/wiki/components/glossary/types.ts
 * owner: duksan
 * created: 2025-09-27 02:58 UTC / 2025-09-27 11:58 KST
 * updated: 2025-09-27 02:58 UTC / 2025-09-27 11:58 KST
 * purpose: Glossary 학습 화면 구성 요소 간에 공유되는 타입 정의
 * doc_refs: ['admin/specs/wiki-glossary-learning.md']
 */

import type { ReactNode } from 'react';
import type { GlossaryTerm } from '@/lib/glossary.server';
import type { LearningLogEntry } from '@/lib/learning-log.server';

export type ViewerTarget = {
  source: 'doc' | 'file';
  path: string;
  name: string;
};

export type ViewerState =
  | { status: 'idle' }
  | { status: 'loading'; target: ViewerTarget }
  | {
      status: 'ready';
      target: ViewerTarget;
      kind: 'markdown' | 'text';
      content: string;
      frontmatter?: Record<string, unknown>;
    }
  | { status: 'error'; target: ViewerTarget; message: string };

export type PreviewPayload = { type: 'term'; term: GlossaryTerm } | { type: 'doc'; path: string };

export type OutlineSection = {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
};

export type LearningNote = {
  timestamp: string;
  content: string;
};

export type LocalLearningEntry = {
  needsFollowup?: boolean;
  notes?: LearningNote[];
};

export type LearningEntryMap = Record<string, LearningLogEntry | undefined>;
