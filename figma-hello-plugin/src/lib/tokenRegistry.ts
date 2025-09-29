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
  'color.surface.input': {
    type: 'SOLID',
    color: { r: 0.95, g: 0.96, b: 0.98 },
  },
  'color.text.primary': {
    type: 'SOLID',
    color: { r: 0.13, g: 0.16, b: 0.22 },
  },
  'color.text.secondary': {
    type: 'SOLID',
    color: { r: 0.31, g: 0.35, b: 0.43 },
  },
  'color.text.positive': {
    type: 'SOLID',
    color: { r: 0.05, g: 0.6, b: 0.32 },
  },
  'color.text.negative': {
    type: 'SOLID',
    color: { r: 0.8, g: 0.2, b: 0.2 },
  },
  'color.text.warning': {
    type: 'SOLID',
    color: { r: 0.85, g: 0.53, b: 0.04 },
  },
  'color.text.link': {
    type: 'SOLID',
    color: { r: 0.09, g: 0.33, b: 0.9 },
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
  'typo.heading.md': {
    font: { family: 'Inter', style: 'Semi Bold' },
    fontSize: 20,
    lineHeight: 28,
    colorToken: 'color.text.primary',
  },
  'typo.heading.sm': {
    font: { family: 'Inter', style: 'Semi Bold' },
    fontSize: 16,
    lineHeight: 24,
    colorToken: 'color.text.primary',
  },
  'typo.body.md': {
    font: { family: 'Inter', style: 'Regular' },
    fontSize: 16,
    lineHeight: 24,
    colorToken: 'color.text.secondary',
  },
  'typo.caption': {
    font: { family: 'Inter', style: 'Medium' },
    fontSize: 12,
    lineHeight: 18,
    colorToken: 'color.text.secondary',
  },
};

interface TypographyToken {
  font: FontName;
  fontSize: number;
  lineHeight?: number;
  colorToken?: string;
  styleId?: string;
}

const FALLBACK_PAINT: SolidPaint = {
  type: 'SOLID',
  color: { r: 1, g: 1, b: 1 },
};

let paintStyleCache: PaintStyle[] | null = null;
let textStyleCache: TextStyle[] | null = null;

function tokenToStyleName(token: string) {
  return token.replace(/\./g, '/');
}

function getPaintStyles(): PaintStyle[] {
  if (!paintStyleCache) {
    paintStyleCache = figma.getLocalPaintStyles();
  }
  return paintStyleCache;
}

function getTextStyles(): TextStyle[] {
  if (!textStyleCache) {
    textStyleCache = figma.getLocalTextStyles();
  }
  return textStyleCache;
}

function findPaintStyle(token: string): PaintStyle | null {
  const name = tokenToStyleName(token);
  return getPaintStyles().find((style) => style.name === name) ?? null;
}

function findTextStyle(token: string): TextStyle | null {
  const name = tokenToStyleName(token);
  return getTextStyles().find((style) => style.name === name) ?? null;
}

export function resolvePaintToken(token: string | undefined): Paint | null {
  if (!token) return null;
  const style = findPaintStyle(token);
  if (style?.paints?.length) {
    return clonePaint(style.paints[0]);
  }
  const paint = COLOR_TOKENS[token];
  return paint ? clonePaint(paint) : clonePaint(FALLBACK_PAINT);
}

export function resolveRadiusToken(token: string | undefined): number | null {
  if (!token) return null;
  return RADIUS_TOKENS[token] ?? null;
}

export function resolveTypographyToken(token: string | undefined): TypographyToken | null {
  if (!token) return null;
  const style = findTextStyle(token);
  if (style && style.fontName !== figma.mixed) {
    return {
      font: style.fontName,
      fontSize: style.fontSize,
      lineHeight:
        style.lineHeight !== figma.mixed && style.lineHeight?.unit === 'PIXELS'
          ? style.lineHeight.value
          : undefined,
      styleId: style.id,
    };
  }
  return TYPOGRAPHY_TOKENS[token] ?? null;
}

export function resolvePaintStyleId(token: string | undefined): string | null {
  if (!token) return null;
  const style = findPaintStyle(token);
  return style?.id ?? null;
}

function clonePaint(paint: Paint): Paint {
  return JSON.parse(JSON.stringify(paint));
}
