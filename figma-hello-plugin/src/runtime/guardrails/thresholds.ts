export const guardrailThresholds = {
  warn: {
    nodeCount: 120,
    depth: 6,
    fileSize: 40 * 1024,
  },
  fail: {
    nodeCount: 200,
    depth: 8,
    fileSize: 80 * 1024,
  },
} as const;
