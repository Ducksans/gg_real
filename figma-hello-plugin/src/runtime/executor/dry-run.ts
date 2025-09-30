import type { ExecutionContext } from './context-factory';

export const runDryPreview = async <T>(
  context: ExecutionContext,
  executor: () => Promise<T>,
): Promise<T> => {
  if (!context.target.frameName.endsWith('_preview')) {
    context.target.frameName = `${context.target.frameName}_preview`;
  }
  return executor();
};
