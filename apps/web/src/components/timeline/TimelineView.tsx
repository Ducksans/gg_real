'use client';

/**
 * file: apps/web/src/components/timeline/TimelineView.tsx
 * owner: duksan
 * created: 2025-09-23 07:28 UTC / 2025-09-23 16:28 KST
 * updated: 2025-09-23 07:56 UTC / 2025-09-23 16:56 KST
 * purpose: 타임라인 이벤트 필터링 UI와 Mermaid 렌더러를 결합해 인터랙티브 화면을 구성한다
 * doc_refs: ["apps/web/src/app/admin/timeline/page.tsx", "apps/web/src/lib/timeline.ts"]
 */

import { useEffect, useMemo, useState } from 'react';

import { MermaidTimeline } from './MermaidTimeline';
import type { TimelineDataset } from '@/lib/timeline';
import { buildMermaidDiagram, filterEvents } from '@/lib/timeline';
import { getStatusColor, getStatusLabel } from '@/lib/status';

interface TimelineViewProps {
  dataset: TimelineDataset;
}

export function TimelineView({ dataset }: TimelineViewProps) {
  const { events, statuses, milestones } = dataset;
  const statusKeys = useMemo(() => {
    const unique = new Set<string>(Object.keys(statuses));
    events.forEach((event) => unique.add(event.status));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [events, statuses]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(statusKeys);
  const [selectedMilestones, setSelectedMilestones] = useState<string[]>(milestones);

  useEffect(() => {
    setSelectedStatuses(statusKeys);
  }, [statusKeys]);

  useEffect(() => {
    setSelectedMilestones(milestones);
  }, [milestones]);

  const filteredEvents = useMemo(
    () =>
      filterEvents(events, {
        statuses: selectedStatuses,
        milestones: selectedMilestones,
      }),
    [events, selectedMilestones, selectedStatuses],
  );

  const chart = useMemo(() => buildMermaidDiagram(filteredEvents), [filteredEvents]);

  const resetFilters = () => {
    setSelectedStatuses(statusKeys);
    setSelectedMilestones(milestones);
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((item) => item !== status) : [...prev, status],
    );
  };

  const toggleMilestone = (milestone: string) => {
    setSelectedMilestones((prev) =>
      prev.includes(milestone) ? prev.filter((item) => item !== milestone) : [...prev, milestone],
    );
  };

  return (
    <div className="space-y-6">
      <Filters
        milestones={milestones}
        selectedMilestones={selectedMilestones}
        selectedStatuses={selectedStatuses}
        statusKeys={statusKeys}
        statuses={statuses}
        onToggleMilestone={toggleMilestone}
        onToggleStatus={toggleStatus}
        onReset={resetFilters}
      />
      <MermaidTimeline chart={chart} />
      <EventList events={filteredEvents} statuses={statuses} />
    </div>
  );
}

interface FiltersProps {
  statusKeys: string[];
  statuses: TimelineDataset['statuses'];
  selectedStatuses: string[];
  milestones: string[];
  selectedMilestones: string[];
  onToggleStatus: (status: string) => void;
  onToggleMilestone: (milestone: string) => void;
  onReset: () => void;
}

function Filters({
  statusKeys,
  statuses,
  selectedStatuses,
  milestones,
  selectedMilestones,
  onToggleStatus,
  onToggleMilestone,
  onReset,
}: FiltersProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">필터</h3>
          <p className="text-xs text-slate-500">
            상태와 마일스톤을 선택해 필요한 일정만 살펴볼 수 있습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
        >
          필터 초기화
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            상태
          </legend>
          <div className="flex flex-wrap gap-2">
            {statusKeys.map((status) => {
              const active = selectedStatuses.includes(status);
              const label = getStatusLabel(statuses, status);
              const color = getStatusColor(statuses, status);
              return (
                <label
                  key={status}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? 'border-slate-700 bg-slate-800 text-white'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={active}
                    onChange={() => onToggleStatus(status)}
                  />
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            마일스톤
          </legend>
          <div className="flex flex-wrap gap-2">
            {milestones.map((milestone) => {
              const active = selectedMilestones.includes(milestone);
              return (
                <label
                  key={milestone}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? 'border-slate-700 bg-slate-800 text-white'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={active}
                    onChange={() => onToggleMilestone(milestone)}
                  />
                  {milestone}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
    </section>
  );
}

interface EventListProps {
  events: TimelineDataset['events'];
  statuses: TimelineDataset['statuses'];
}

function EventList({ events, statuses }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="rounded border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        선택된 조건을 만족하는 일정이 없습니다. 다른 필터를 시도해 보세요.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-2 text-left">
              작업
            </th>
            <th scope="col" className="px-4 py-2 text-left">
              마일스톤
            </th>
            <th scope="col" className="px-4 py-2 text-left">
              상태
            </th>
            <th scope="col" className="px-4 py-2 text-left">
              일정
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {events.map((event) => {
            const label = getStatusLabel(statuses, event.status);
            const color = getStatusColor(statuses, event.status);
            return (
              <tr key={event.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{event.title}</td>
                <td className="px-4 py-3 text-slate-600">{event.milestone}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {label}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {event.start} → {event.end}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
