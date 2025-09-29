import type { LayoutSpec, NodeSpec } from '../schema';

export interface BuildContext {
  tokenResolver: (token: string) => Paint | null;
  radiusResolver: (token: string) => number | null;
  typographyResolver: (token: string) => TypographyToken | null;
}

interface TypographyToken {
  font: FontName;
  fontSize: number;
  lineHeight?: number;
  colorToken?: string;
}

export async function buildNodesFromSchema(
  specs: NodeSpec[],
  ctx: BuildContext,
): Promise<SceneNode[]> {
  const created: SceneNode[] = [];

  for (const spec of specs) {
    const node = await createNode(spec, ctx);
    if (node) {
      created.push(node);
    }
  }

  return created;
}

async function createNode(spec: NodeSpec, ctx: BuildContext): Promise<SceneNode | null> {
  switch (spec.type) {
    case 'text':
      return createTextNode(spec, ctx);
    case 'frame':
    case 'stack':
      return createFrameNode(spec, ctx);
    case 'spacer':
      return createSpacer(spec);
    default:
      figma.notify(`아직 지원하지 않는 노드 타입: ${spec.type}`, { timeout: 2000 });
      return null;
  }
}

async function createTextNode(
  spec: Extract<NodeSpec, { type: 'text' }>,
  ctx: BuildContext,
): Promise<TextNode> {
  const text = figma.createText();
  const { fontName, fontSize, lineHeight, fillPaint } = await resolveTextStyle(spec, ctx);

  if (fontName) {
    await figma.loadFontAsync(fontName);
    text.fontName = fontName;
  }
  if (fontSize) {
    text.fontSize = fontSize;
  }
  if (lineHeight) {
    text.lineHeight = { value: lineHeight, unit: 'PIXELS' };
  }
  if (fillPaint) {
    text.fills = [fillPaint];
  }

  text.characters = spec.text.content;
  applyPluginData(text, spec.pluginData);
  applyConstraints(text, spec.constraints);

  return text;
}

async function createFrameNode(
  spec: Extract<NodeSpec, { type: 'frame' | 'stack' }>,
  ctx: BuildContext,
): Promise<FrameNode> {
  const frame = figma.createFrame();
  frame.name = spec.name;

  const usesAutoLayout = spec.layout?.type === 'auto' || spec.type === 'stack';
  applySize(frame, spec.size, usesAutoLayout);

  if (usesAutoLayout) {
    frame.layoutMode = spec.layout?.direction === 'HORIZONTAL' ? 'HORIZONTAL' : 'VERTICAL';
    applyAutoLayout(frame, spec.layout);
  } else {
    frame.layoutMode = 'NONE';
  }

  applyTokens(frame, spec.tokens, ctx);
  applyPluginData(frame, spec.pluginData);
  applyConstraints(frame, spec.constraints);

  if (spec.children?.length) {
    const nested = await buildNodesFromSchema(spec.children, ctx);
    nested.forEach((child) => frame.appendChild(child));
  }

  return frame;
}

async function createSpacer(spec: Extract<NodeSpec, { type: 'spacer' }>): Promise<RectangleNode> {
  const rect = figma.createRectangle();
  rect.name = spec.name;
  rect.opacity = 0;
  rect.resize(spec.size?.width ?? 1, spec.size?.height ?? 1);
  rect.fills = [];
  if (spec.layout?.grow) {
    rect.layoutGrow = spec.layout.grow;
  }
  applyPluginData(rect, spec.pluginData);
  applyConstraints(rect, spec.constraints);
  return rect;
}

async function resolveTextStyle(spec: Extract<NodeSpec, { type: 'text' }>, ctx: BuildContext) {
  const directStyle = spec.text.style;
  let fontName = directStyle?.font ?? null;
  let fontSize = directStyle?.fontSize ?? null;
  let lineHeight = directStyle?.lineHeight ?? undefined;
  let fillPaint: Paint | null = null;

  if (directStyle?.token) {
    const token = ctx.typographyResolver(directStyle.token);
    if (token) {
      fontName = token.font;
      fontSize = token.fontSize;
      lineHeight = token.lineHeight ?? undefined;
      if (token.colorToken) {
        fillPaint = ctx.tokenResolver(token.colorToken);
      }
    }
  }

  if (!fillPaint && spec.tokens?.text) {
    fillPaint = ctx.tokenResolver(spec.tokens.text);
  }

  if (spec.tokens?.fill) {
    fillPaint = ctx.tokenResolver(spec.tokens.fill);
  }

  return { fontName, fontSize, lineHeight, fillPaint };
}

function applySize(
  frame: FrameNode,
  size: { width?: number; height?: number } | undefined,
  autoLayout: boolean,
) {
  const hasWidth = typeof size?.width === 'number';
  const hasHeight = typeof size?.height === 'number';

  if (hasWidth && hasHeight) {
    frame.resize(size!.width!, size!.height!);
  } else if (autoLayout) {
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'AUTO';
  }
}

function applyAutoLayout(frame: FrameNode, layout?: LayoutSpec) {
  if (!layout) return;

  if (typeof layout.spacing === 'number') {
    frame.itemSpacing = layout.spacing;
  }
  if (layout.padding) {
    const { top = 0, right = 0, bottom = 0, left = 0 } = layout.padding;
    frame.paddingTop = top;
    frame.paddingRight = right;
    frame.paddingBottom = bottom;
    frame.paddingLeft = left;
  }

  if (layout.primaryAlign) {
    const primaryAlignValue = primaryAlignMap[layout.primaryAlign] ?? 'MIN';
    frame.primaryAxisAlignItems = primaryAlignValue;
  }

  if (layout.counterAlign) {
    if (layout.counterAlign === 'STRETCH') {
      frame.counterAxisSizingMode = 'AUTO';
      frame.counterAxisAlignItems = 'MIN';
    } else {
      const counterAlignValue = counterAlignMap[layout.counterAlign] ?? 'MIN';
      frame.counterAxisAlignItems = counterAlignValue;
    }
  }
}

function applyTokens(
  node: SceneNode,
  tokens: Record<string, string> | undefined,
  ctx: BuildContext,
) {
  if (!tokens) return;

  if ('fill' in tokens && 'fills' in node) {
    const paint = ctx.tokenResolver(tokens.fill);
    if (paint) {
      node.fills = [clonePaint(paint)];
    }
  }

  if ('stroke' in tokens && 'strokes' in node) {
    const paint = ctx.tokenResolver(tokens.stroke);
    if (paint) {
      node.strokes = [clonePaint(paint)];
    }
  }

  if ('radius' in tokens) {
    const radius = ctx.radiusResolver(tokens.radius);
    if (typeof radius === 'number' && isCornerMixin(node)) {
      node.cornerRadius = radius;
    }
  }
}

function applyPluginData(
  node: SceneNode,
  pluginData: Record<string, string | number | boolean> | undefined,
) {
  if (!pluginData) return;

  Object.entries(pluginData).forEach(([key, value]) => {
    node.setPluginData(key, String(value));
  });
}

function applyConstraints(node: SceneNode, constraints?: Partial<Constraints>) {
  if (!constraints || !('constraints' in node)) return;

  node.constraints = {
    horizontal: constraints.horizontal ?? node.constraints.horizontal,
    vertical: constraints.vertical ?? node.constraints.vertical,
  };
}

function clonePaint(paint: Paint): Paint {
  return JSON.parse(JSON.stringify(paint));
}

const primaryAlignMap: Record<string, 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN'> = {
  START: 'MIN',
  CENTER: 'CENTER',
  END: 'MAX',
  SPACE_BETWEEN: 'SPACE_BETWEEN',
};

const counterAlignMap: Record<string, 'MIN' | 'CENTER' | 'MAX' | 'BASELINE'> = {
  START: 'MIN',
  CENTER: 'CENTER',
  END: 'MAX',
  BASELINE: 'BASELINE',
};

function isCornerMixin(node: SceneNode): node is SceneNode & CornerMixin {
  return 'cornerRadius' in node;
}
