/**
 * file: apps/web/src/lib/__tests__/graph.test.ts
 * owner: duksan
 * created: 2025-09-26 02:00 UTC / 2025-09-26 11:00 KST
 * updated: 2025-09-26 02:00 UTC / 2025-09-26 11:00 KST
 * purpose: /admin/graph 의 데이터 가공 로직을 검증해 UI 패널과 상태 일관성을 확인
 * doc_refs: ['basesettings.md']
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createPositionedNodes, createStyledEdges } from '../graph';
import { loadGraphDataset } from '../graph-data.server';
import { loadTimelineDataset } from '../timeline-data.server';

const SAMPLE_DATASET = {
  nodes: [
    { id: 'infra', type: 'infra', label: 'GitHub Actions', status: 'completed' },
    { id: 'web', type: 'app', label: 'apps/web', status: 'in_progress' },
  ],
  edges: [{ from: 'infra', to: 'web', type: 'feeds' }],
};

test('createPositionedNodes enriches data with labels and colours', () => {
  const statuses = {
    completed: { label: '완료', color: '#15803d', icon: 'check' },
    in_progress: { label: '진행중', color: '#1d4ed8', icon: 'play' },
  } as const;

  const nodes = createPositionedNodes(SAMPLE_DATASET.nodes, statuses);
  assert.equal(nodes.length, 2);
  assert.equal(nodes[0].data.statusLabel, '완료');
  assert.ok(
    nodes[0].style.backgroundColor.includes('#') ||
      nodes[0].style.backgroundColor === 'rgb(21, 128, 61)',
  );
  assert.equal(nodes[1].data.statusLabel, '진행중');
  assert.ok(nodes[1].position.x !== nodes[0].position.x, '타입에 따라 열이 달라야 합니다');
});

test('createStyledEdges applies meta information to edges', () => {
  const edges = createStyledEdges(SAMPLE_DATASET.edges);
  assert.equal(edges.length, 1);
  assert.equal(edges[0].label, '데이터 공급');
  assert.equal(edges[0].style.stroke, '#2563eb');
});

test('loadGraphDataset wires statuses consistently with timeline dataset', async () => {
  const [graph, timeline] = await Promise.all([loadGraphDataset(), loadTimelineDataset()]);

  assert.ok(graph.nodes.length > 0, '그래프 노드가 최소 1개 이상이어야 합니다');
  graph.nodes.forEach((node) => {
    assert.ok(
      graph.statuses[node.status],
      `노드 ${node.id} 상태(${node.status})가 상태 구성에 존재해야 합니다`,
    );
  });

  const graphStatuses = new Set(Object.keys(graph.statuses));
  const timelineStatuses = new Set(Object.keys(timeline.statuses));
  graphStatuses.forEach((status) => {
    assert.ok(
      timelineStatuses.has(status),
      `그래프 상태 ${status} 는 타임라인 상태 정의에도 존재해야 합니다`,
    );
  });
});
