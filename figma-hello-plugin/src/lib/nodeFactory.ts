import { NodeSpec } from '../schema';

export interface BuildContext {
  tokenResolver: (token: string) => Paint | SolidPaint | null;
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
      return createTextNode(spec);
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

async function createTextNode(spec: Extract<NodeSpec, { type: 'text' }>): Promise<TextNode> {
  const text = figma.createText();
  const { fontName, fontSize } = resolveTextStyle(spec.text.style);
  if (fontName) {
    await figma.loadFontAsync(fontName);
    text.fontName = fontName;
  }
  if (fontSize) {
    text.fontSize = fontSize;
  }
  text.characters = spec.text.content;
  return text;
}

async function createFrameNode(
  spec: Extract<NodeSpec, { type: 'frame' | 'stack' }>,
  ctx: BuildContext,
): Promise<FrameNode> {
  const frame = figma.createFrame();
  frame.name = spec.name;
  if (spec.size?.width && spec.size.width > 0 && spec.size?.height && spec.size.height > 0) {
    frame.resize(spec.size.width, spec.size.height);
  }

  if (spec.layout?.type === 'auto' || spec.type === 'stack') {
    frame.layoutMode = spec.layout?.direction === 'HORIZONTAL' ? 'HORIZONTAL' : 'VERTICAL';
    if (typeof spec.layout?.spacing === 'number') {
      frame.itemSpacing = spec.layout.spacing;
    }
    if (spec.layout?.padding) {
      const { top = 0, right = 0, bottom = 0, left = 0 } = spec.layout.padding;
      frame.paddingTop = top;
      frame.paddingRight = right;
      frame.paddingBottom = bottom;
      frame.paddingLeft = left;
    }
  }

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
  return rect;
}

function resolveTextStyle(style?: { font?: FontName; fontSize?: number; token?: string }) {
  const fontName = style?.font ?? null;
  const fontSize = style?.fontSize ?? null;
  return { fontName, fontSize };
}
