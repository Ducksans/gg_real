/**
 * file: apps/web/src/lib/timeline-data.server.ts
 * owner: duksan
 * created: 2025-09-23 07:23 UTC / 2025-09-23 16:23 KST
 * updated: 2025-09-23 07:23 UTC / 2025-09-23 16:23 KST
 * purpose: 파일 시스템에서 타임라인 이벤트와 상태 구성을 로드해 화면에 전달한다
 * doc_refs: ["admin/data/timeline.events.json", "admin/config/status.yaml", "apps/web/src/app/admin/timeline/page.tsx"]
 */

import { loadJson } from './content';
import { loadStatusConfig } from './status.server';
import type { TimelineDataset, TimelineEvent } from './timeline';
import { getMilestones, sortEvents } from './timeline';

interface TimelineDataFile {
  doc_refs?: string[];
  events: TimelineEvent[];
}

export async function loadTimelineDataset(): Promise<TimelineDataset> {
  const [statusConfig, timeline] = await Promise.all([
    loadStatusConfig(),
    loadJson<TimelineDataFile>('admin/data/timeline.events.json'),
  ]);

  const events = sortEvents(timeline.events);
  const milestones = getMilestones(events);

  return {
    events,
    milestones,
    statuses: statusConfig,
    docRefs: timeline.doc_refs ?? [],
  };
}
