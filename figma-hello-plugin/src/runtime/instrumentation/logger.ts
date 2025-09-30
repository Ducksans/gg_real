/**
 * 런타임 로깅 헬퍼. 후속 확장에서 Sentry/콘솔 등을 추상화한다.
 */
export const runtimeLogger = {
  info: (..._args: unknown[]) => {
    throw new Error('runtimeLogger.info not implemented');
  },
  warn: (..._args: unknown[]) => {
    throw new Error('runtimeLogger.warn not implemented');
  },
  error: (..._args: unknown[]) => {
    throw new Error('runtimeLogger.error not implemented');
  },
};
