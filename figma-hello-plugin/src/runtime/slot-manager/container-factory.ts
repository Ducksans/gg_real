import type { SurfaceConfig } from '../surface-config';
import type { SchemaDocument } from '../../schema';

import { calculateNextY, ensureAutoLayout } from './transformers/auto-layout';

export const findTargetPage = (pageName: string): PageNode => {
  const match = figma.root.findOne(
    (node) => node.type === 'PAGE' && node.name === pageName,
  ) as PageNode | null;

  if (match) return match;
  throw new Error(`페이지 '${pageName}'을(를) 찾을 수 없습니다.`);
};

export const removeExistingFrame = (page: PageNode, frameName: string) => {
  const existing = page.findOne((node) => node.type === 'FRAME' && node.name === frameName);
  existing?.remove();
};

const isPreviewFrame = (frameName: string, intent?: 'dry-run' | 'apply') =>
  intent === 'dry-run' || frameName.endsWith('_preview');

const PREVIEW_FRAME_WIDTH = 2000;
const PREVIEW_FRAME_HEIGHT = 1200;
const PREVIEW_FRAME_POSITION = { x: -2100, y: -1300 };
const PREVIEW_FRAME_FILL = {
  type: 'SOLID' as const,
  color: {
    r: 0.9529411765,
    g: 0.9568627451,
    b: 0.9647058824,
  },
};

export const prepareTargetFrame = (
  page: PageNode,
  target: Required<SchemaDocument['target']>,
  surface: SurfaceConfig,
  intent?: 'dry-run' | 'apply',
): FrameNode => {
  let frame = page.findOne(
    (node) => node.type === 'FRAME' && node.name === target.frameName,
  ) as FrameNode | null;

  if (frame && target.mode === 'replace') {
    frame.remove();
    frame = null;
  }

  const previewFrame = isPreviewFrame(target.frameName, intent);

  if (!frame) {
    frame = figma.createFrame();
    frame.name = target.frameName;
    ensureAutoLayout(frame);

    if (previewFrame) {
      frame.resizeWithoutConstraints(PREVIEW_FRAME_WIDTH, PREVIEW_FRAME_HEIGHT);
      frame.x = PREVIEW_FRAME_POSITION.x;
      frame.y = PREVIEW_FRAME_POSITION.y;
      frame.fills = [PREVIEW_FRAME_FILL];
    } else {
      const targetWidth = surface.width ?? 900;
      const targetHeight = surface.height ?? 10;
      frame.resizeWithoutConstraints(targetWidth, targetHeight);

      const nextY = calculateNextY(page);
      frame.x = 0;
      frame.y = nextY;
    }

    page.appendChild(frame);
  } else {
    ensureAutoLayout(frame);

    if (previewFrame) {
      frame.resizeWithoutConstraints(PREVIEW_FRAME_WIDTH, PREVIEW_FRAME_HEIGHT);
      frame.x = PREVIEW_FRAME_POSITION.x;
      frame.y = PREVIEW_FRAME_POSITION.y;
      frame.fills = [PREVIEW_FRAME_FILL];
    }
  }

  return frame;
};
