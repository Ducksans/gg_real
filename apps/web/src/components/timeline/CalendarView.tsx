'use client';

/**
 * file: apps/web/src/components/timeline/CalendarView.tsx
 * owner: duksan
 * created: 2025-09-23 12:22 UTC / 2025-09-23 21:22 KST
 * updated: 2025-09-23 12:22 UTC / 2025-09-23 21:22 KST
 * purpose: FullCalendar 월/주 뷰로 타임라인 이벤트를 표시한다
 * doc_refs: ["apps/web/src/lib/timeline.ts", "apps/web/src/app/admin/timeline/page.tsx"]
 */

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useMemo } from 'react';
import type { TimelineDataset } from '@/lib/timeline';

// CSS는 글로벌 번들 충돌을 피하기 위해 일단 제외(필요 시 전역에 개별 추가)

interface CalendarViewProps {
  dataset: TimelineDataset;
}

export function CalendarView({ dataset }: CalendarViewProps) {
  const events = useMemo(
    () =>
      dataset.events.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
      })),
    [dataset.events],
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek',
        }}
        height="auto"
        events={events}
        dayMaxEventRows={3}
        firstDay={1}
      />
    </div>
  );
}
