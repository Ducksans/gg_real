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

export const prepareTargetFrame = (
  page: PageNode,
  target: Required<SchemaDocument['target']>,
  surface: SurfaceConfig,
): FrameNode => {
  let frame = page.findOne(
    (node) => node.type === 'FRAME' && node.name === target.frameName,
  ) as FrameNode | null;

  if (frame && target.mode === 'replace') {
    frame.remove();
    frame = null;
  }

  if (!frame) {
    frame = figma.createFrame();
    frame.name = target.frameName;
    ensureAutoLayout(frame);

    const targetWidth = surface.width ?? 900;
    const targetHeight = surface.height ?? 10;
    frame.resizeWithoutConstraints(targetWidth, targetHeight);

    const nextY = calculateNextY(page);
    frame.x = 0;
    frame.y = nextY;

    page.appendChild(frame);
  } else {
    ensureAutoLayout(frame);
  }

  return frame;
};
