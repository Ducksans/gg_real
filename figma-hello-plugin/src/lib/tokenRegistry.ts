const COLOR_TOKENS: Record<string, SolidPaint> = {
  'color.surface.base': {
    type: 'SOLID',
    color: { r: 0.97, g: 0.98, b: 0.99 },
  },
  'color.surface.card': {
    type: 'SOLID',
    color: { r: 0.94, g: 0.96, b: 1 },
  },
  'color.surface.muted': {
    type: 'SOLID',
    color: { r: 0.89, g: 0.91, b: 0.96 },
  },
  'color.text.primary': {
    type: 'SOLID',
    color: { r: 0.13, g: 0.16, b: 0.22 },
  },
  'color.text.secondary': {
    type: 'SOLID',
    color: { r: 0.31, g: 0.35, b: 0.43 },
  },
};

const RADIUS_TOKENS: Record<string, number> = {
  'radius.none': 0,
  'radius.sm': 6,
  'radius.md': 12,
  'radius.lg': 16,
};

const TYPOGRAPHY_TOKENS: Record<string, TypographyToken> = {
  'typo.heading.lg': {
    font: { family: 'Inter', style: 'Semi Bold' },
    fontSize: 28,
    lineHeight: 34,
    colorToken: 'color.text.primary',
  },
  'typo.body.md': {
    font: { family: 'Inter', style: 'Regular' },
    fontSize: 16,
    lineHeight: 24,
    colorToken: 'color.text.secondary',
  },
};

interface TypographyToken {
  font: FontName;
  fontSize: number;
  lineHeight?: number;
  colorToken?: string;
}

const FALLBACK_PAINT: SolidPaint = {
  type: 'SOLID',
  color: { r: 1, g: 1, b: 1 },
};

export function resolvePaintToken(token: string | undefined): Paint | null {
  if (!token) return null;
  const paint = COLOR_TOKENS[token];
  return paint ? clonePaint(paint) : clonePaint(FALLBACK_PAINT);
}

export function resolveRadiusToken(token: string | undefined): number | null {
  if (!token) return null;
  return RADIUS_TOKENS[token] ?? null;
}

export function resolveTypographyToken(token: string | undefined): TypographyToken | null {
  if (!token) return null;
  return TYPOGRAPHY_TOKENS[token] ?? null;
}

function clonePaint(paint: Paint): Paint {
  return JSON.parse(JSON.stringify(paint));
}
