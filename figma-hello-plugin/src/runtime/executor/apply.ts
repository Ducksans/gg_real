import type { ExecutionContext } from './context-factory';

export const applyExecution = async <T>(
  context: ExecutionContext,
  executor: () => Promise<T>,
): Promise<T> => {
  if (context.intent === 'dry-run') {
    return executor();
  }
  return executor();
};
