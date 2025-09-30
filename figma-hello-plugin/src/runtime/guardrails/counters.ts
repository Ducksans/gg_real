import type { NodeSpec } from '../../schema';

export interface NodeGraphMetrics {
  readonly count: number;
  readonly maxDepth: number;
}

const traverse = (nodes: NodeSpec[], depth = 1): NodeGraphMetrics => {
  let count = 0;
  let maxDepth = depth;

  nodes.forEach((node) => {
    count += 1;
    if ('children' in node && Array.isArray((node as { children?: NodeSpec[] }).children)) {
      const child = traverse((node as { children?: NodeSpec[] }).children ?? [], depth + 1);
      count += child.count;
      if (child.maxDepth > maxDepth) {
        maxDepth = child.maxDepth;
      }
    }
  });

  return { count, maxDepth };
};

export const measureNodeGraph = (nodes: NodeSpec[] = []): NodeGraphMetrics => traverse(nodes);
