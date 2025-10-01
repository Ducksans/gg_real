import { describe, expect, it } from 'vitest';

import {
  isExecutionPayload,
  sanitizeExecutionPayload,
  type ExecutionIntent,
  type ExecutionMode,
} from '../src/shared/execution-contract';
import { runSchemaBatch } from '../src/runtime/executor';

describe('ExecutionPayload contract', () => {
  it('recognizes a valid payload and trims optional fields', () => {
    const payload = {
      intent: 'dry-run' as ExecutionIntent,
      documents: [' {"schemaVersion":"1.0.0"} '],
      targetPage: '  Admin Page  ',
      targetFrameName: '  FrameName  ',
      targetMode: 'append' as ExecutionMode,
    };

    expect(isExecutionPayload(payload)).toBe(true);

    const sanitized = sanitizeExecutionPayload(payload);
    expect(sanitized.documents).toEqual(['{"schemaVersion":"1.0.0"}']);
    expect(sanitized.targetPage).toBe('Admin Page');
    expect(sanitized.targetFrameName).toBe('FrameName');
    expect(sanitized.targetMode).toBe('append');
  });

  it('rejects payloads without documents', () => {
    const payload = { intent: 'dry-run', documents: [] } as unknown;
    expect(isExecutionPayload(payload)).toBe(false);
  });

  it('throws when documents contain empty strings after trimming', () => {
    expect(() =>
      sanitizeExecutionPayload({
        intent: 'dry-run',
        documents: ['   '],
      }),
    ).toThrow('ExecutionPayload.documents[0] is empty after trimming.');
  });

  it('throws when targetMode is invalid', () => {
    expect(() =>
      sanitizeExecutionPayload({
        intent: 'apply',
        documents: ['{"schemaVersion":"1.0.0"}'],
        targetMode: 'invalid-mode' as ExecutionMode,
      }),
    ).toThrow('ExecutionPayload.targetMode has an invalid value.');
  });
});

describe('runSchemaBatch validation', () => {
  it('throws when any document entry is not a string', async () => {
    await expect(
      runSchemaBatch([undefined as unknown as string], { intent: 'dry-run' }),
    ).rejects.toThrow('ExecutionPayload.documents must be stringified JSON strings.');
  });

  it('throws when any document entry is blank after trimming', async () => {
    await expect(runSchemaBatch(['   '], { intent: 'apply' })).rejects.toThrow(
      'ExecutionPayload.documents must be stringified JSON strings.',
    );
  });
});
