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

export function buildMermaidDiagram(events: TimelineEvent[], statuses: StatusConfig): string {
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
          lines.push(`    ${event.title} :${event.id}, ${event.start}, ${event.end}`);
        });
    });

  const usedStatuses = new Set(events.map((event) => event.status));
  lines.push('');
  lines.push('  %% status classes');
  usedStatuses.forEach((status) => {
    const definition = statuses[status];
    const fill = definition?.color ?? '#6b7280';
    const textColor = '#ffffff';
    lines.push(`  classDef ${status} fill:${fill},stroke:${fill},color:${textColor};`);
  });
  events.forEach((event) => {
    lines.push(`  class ${event.id} ${event.status}`);
  });

  return lines.join('\n');
}

export function getMilestones(events: TimelineEvent[]): string[] {
  return Array.from(new Set(events.map((event) => event.milestone))).sort((a, b) =>
    a.localeCompare(b),
  );
}
