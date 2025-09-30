export type NodeType = 'frame' | 'stack' | 'text' | 'component' | 'vector' | 'image' | 'spacer';

export type NodeOperation = 'add' | 'update' | 'remove';

export type ConstraintHorizontal = 'LEFT' | 'RIGHT' | 'CENTER' | 'LEFT_RIGHT' | 'SCALE' | 'STRETCH';
export type ConstraintVertical = 'TOP' | 'BOTTOM' | 'CENTER' | 'TOP_BOTTOM' | 'SCALE' | 'STRETCH';

export interface Constraints {
  horizontal?: ConstraintHorizontal;
  vertical?: ConstraintVertical;
}

export interface BaseNodeSpec {
  type: NodeType;
  name: string;
  tokens?: Record<string, string>;
  constraints?: Partial<Constraints>;
  pluginData?: Record<string, string | number | boolean>;
  idempotentKey?: string;
  operation?: NodeOperation;
}

export interface Size {
  width?: number;
  height?: number;
}

export interface LayoutSpec {
  type?: 'auto' | 'absolute';
  direction?: 'VERTICAL' | 'HORIZONTAL';
  primaryAlign?: 'START' | 'CENTER' | 'END' | 'SPACE_BETWEEN';
  counterAlign?: 'START' | 'CENTER' | 'END' | 'STRETCH';
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  spacing?: number;
  grow?: number;
  grid?: {
    columns: number;
    gutter: number;
    margins: number;
  };
}

export interface TextSpec {
  content: string;
  style?: {
    font?: { family: string; style: string };
    fontSize?: number;
    lineHeight?: number;
    letterSpacing?: number;
    textCase?: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE';
    textDecoration?: 'NONE' | 'UNDERLINE';
    token?: string;
  };
}

export interface FrameNodeSpec extends BaseNodeSpec {
  type: 'frame' | 'stack';
  size?: Size;
  layout?: LayoutSpec;
  fills?: Paint[];
  strokes?: Paint[];
  cornerRadius?: number;
  children?: NodeSpec[];
}

export interface TextNodeSpec extends BaseNodeSpec {
  type: 'text';
  text: TextSpec;
  size?: Size;
}

export interface ComponentNodeSpec extends BaseNodeSpec {
  type: 'component';
  componentKey: string;
  overrides?: Record<string, string>;
  size?: Size;
}

export interface ImageNodeSpec extends BaseNodeSpec {
  type: 'image';
  size: Size;
  imageRef: string;
  cornerRadius?: number;
}

export interface SpacerNodeSpec extends BaseNodeSpec {
  type: 'spacer';
  size?: Size;
  layout?: LayoutSpec;
}

export type NodeSpec =
  | FrameNodeSpec
  | TextNodeSpec
  | ComponentNodeSpec
  | ImageNodeSpec
  | SpacerNodeSpec;

export interface BoxPadding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface SurfaceSlotSpec {
  id: string;
  label: string;
  parent: string | null;
  layout?: 'VERTICAL' | 'HORIZONTAL';
  spacing?: number;
  padding?: BoxPadding;
  width?: number | 'hug' | 'fill';
  height?: number | 'hug';
  grow?: number;
  allowedSections?: string[];
}

export interface SurfaceLayoutSpec {
  width: number;
  height?: number | null;
  padding?: BoxPadding;
  spacing?: number;
  background?: string | null;
}

export interface SurfaceSpec {
  id: string;
  label: string;
  layout: SurfaceLayoutSpec;
  slots: SurfaceSlotSpec[];
  requiredSlots?: string[];
}

export interface SchemaDocument {
  schemaVersion: string;
  meta?: {
    title?: string;
    description?: string;
    createdBy?: string;
    tokenset?: string;
    designSurface?: string;
    designSurfaceLabel?: string;
    route?: string;
    routeLabel?: string;
    slot?: string;
    slotLabel?: string;
    section?: string;
    sectionLabel?: string;
  };
  target: {
    page?: string;
    frameName: string;
    mode: 'replace' | 'append' | 'update';
  };
  nodes: NodeSpec[];
}
