export interface ProfilingSample {
  readonly phase: string;
  readonly durationMs: number;
}

export const profileSlotManager = <T>(
  phase: string,
  fn: () => T,
): { result: T; samples: ProfilingSample[] } => {
  const start = Date.now();
  const result = fn();
  const duration = Date.now() - start;
  return { result, samples: [{ phase, durationMs: duration }] };
};
