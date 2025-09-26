/**
 * file: apps/web/src/lib/__tests__/timeline.test.ts
 * owner: duksan
 * created: 2025-09-26 02:00 UTC / 2025-09-26 11:00 KST
 * updated: 2025-09-26 02:00 UTC / 2025-09-26 11:00 KST
 * purpose: /admin/timeline 기능의 핵심 유틸리티를 검증해 QA 자동화를 보장
 * doc_refs: ['basesettings.md']
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  sortEvents,
  filterEvents,
  buildMermaidDiagram,
  getMilestones,
  type TimelineEvent,
} from '../timeline';
import { loadTimelineDataset } from '../timeline-data.server';

const SAMPLE_EVENTS: TimelineEvent[] = [
  {
    id: 'a',
    title: '첫 번째 작업',
    milestone: 'M1',
    status: 'completed',
    start: '2025-09-01',
    end: '2025-09-02',
  },
  {
    id: 'b',
    title: '두 번째 작업',
    milestone: 'M1',
    status: 'in_progress',
    start: '2025-09-03',
    end: '2025-09-05',
  },
  {
    id: 'c',
    title: '세 번째 작업',
    milestone: 'M2',
    status: 'pending',
    start: '2025-09-04',
    end: '2025-09-06',
  },
];

test('sortEvents sorts by start date ascending', () => {
  const sorted = sortEvents([...SAMPLE_EVENTS]);
  assert.deepEqual(
    sorted.map((event) => event.id),
    ['a', 'b', 'c'],
  );
});

test('filterEvents filters by status and milestone', () => {
  const filtered = filterEvents(SAMPLE_EVENTS, {
    statuses: ['completed', 'in_progress'],
    milestones: ['M1'],
  });
  assert.deepEqual(
    filtered.map((event) => event.id),
    ['a', 'b'],
  );
});

test('buildMermaidDiagram outputs gantt syntax with sections', () => {
  const diagram = buildMermaidDiagram(SAMPLE_EVENTS);
  assert.ok(diagram.includes('gantt'));
  assert.ok(diagram.includes('section M1'));
  assert.ok(diagram.includes('첫 번째 작업'));
});

test('loadTimelineDataset pulls statuses and milestones from files', async () => {
  const dataset = await loadTimelineDataset();

  assert.ok(dataset.events.length > 0, '이벤트가 최소 1개 이상이어야 합니다');
  assert.ok(dataset.milestones.length > 0, '마일스톤이 최소 1개 이상이어야 합니다');

  const milestoneSet = new Set(dataset.milestones);
  dataset.events.forEach((event) => {
    assert.ok(
      milestoneSet.has(event.milestone),
      `이벤트 ${event.id}의 마일스톤이 목록에 포함되어야 합니다`,
    );
    assert.ok(
      dataset.statuses[event.status],
      `이벤트 ${event.id} 상태(${event.status})가 상태 설정에 존재해야 합니다`,
    );
  });

  const computedMilestones = getMilestones(dataset.events);
  assert.deepEqual(
    computedMilestones,
    [...computedMilestones].sort((a, b) => a.localeCompare(b)),
    '마일스톤 목록은 알파벳 순 정렬이어야 합니다',
  );
});
