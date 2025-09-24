/**
 * file: apps/web/src/lib/timeline.ts
 * owner: duksan
 * created: 2025-09-23 07:18 UTC / 2025-09-23 16:18 KST
 * updated: 2025-09-23 07:18 UTC / 2025-09-23 16:18 KST
 * purpose: 타임라인 이벤트 데이터를 정렬·필터링하고 Mermaid 간트 다이어그램 문자열을 생성한다
 * doc_refs: ["admin/data/timeline.events.json", "apps/web/src/app/admin/timeline/page.tsx"]
 */

import type { StatusConfig } from './status';

export type TimelineEvent = {
  id: string;
  title: string;
  milestone: string;
  status: string;
  start: string;
  end: string;
};

export type TimelineDataset = {
  events: TimelineEvent[];
  statuses: StatusConfig;
  milestones: string[];
  docRefs: string[];
};

export type TimelineFilters = {
  statuses: string[];
  milestones: string[];
};

export function sortEvents(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((a, b) => a.start.localeCompare(b.start));
}

export function filterEvents(events: TimelineEvent[], filters: TimelineFilters): TimelineEvent[] {
  const { statuses, milestones } = filters;
  const statusSet = new Set(statuses);
  const milestoneSet = new Set(milestones);
  return events.filter((event) => {
    const statusOk = statusSet.size === 0 || statusSet.has(event.status);
    const milestoneOk = milestoneSet.size === 0 || milestoneSet.has(event.milestone);
    return statusOk && milestoneOk;
  });
}

const STATUS_KEYWORD_MAP: Record<string, string> = {
  completed: 'done',
  in_progress: 'active',
  failed: 'crit',
  design_change: 'crit',
  on_hold: 'crit',
  pending: '',
};

export function buildMermaidDiagram(events: TimelineEvent[]): string {
  if (events.length === 0) {
    return '';
  }

  const sections = new Map<string, TimelineEvent[]>();
  events.forEach((event) => {
    const list = sections.get(event.milestone) ?? [];
    list.push(event);
    sections.set(event.milestone, list);
  });

  const lines: string[] = [];
  lines.push('gantt');
  lines.push('  title Sprint 9 — Timeline Progress');
  lines.push('  dateFormat  YYYY-MM-DD');
  lines.push('  axisFormat  %m/%d');
  lines.push('  todayMarker stroke-width:2,stroke:#111827');

  Array.from(sections.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([milestone, milestoneEvents]) => {
      lines.push(`  section ${milestone}`);
      milestoneEvents
        .sort((a, b) => a.start.localeCompare(b.start))
        .forEach((event) => {
          const keyword = STATUS_KEYWORD_MAP[event.status] ?? '';
          const taskId = event.id.replace(/[^A-Za-z0-9_]/g, '_');
          const taskParts = [taskId];
          if (keyword) {
            taskParts.unshift(keyword);
          }
          lines.push(`    ${event.title} :${taskParts.join(', ')}, ${event.start}, ${event.end}`);
        });
    });

  return lines.join('\n');
}

export function getMilestones(events: TimelineEvent[]): string[] {
  return Array.from(new Set(events.map((event) => event.milestone))).sort((a, b) =>
    a.localeCompare(b),
  );
}
