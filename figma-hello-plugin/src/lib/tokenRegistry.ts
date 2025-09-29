const fallbackFills: Paint = {
  type: 'SOLID',
  color: { r: 1, g: 1, b: 1 },
};

export function resolvePaintToken(token: string | undefined): Paint {
  if (!token) {
    return fallbackFills;
  }

  // TODO: 실제 토큰 JSON 매핑 구현
  return fallbackFills;
}
