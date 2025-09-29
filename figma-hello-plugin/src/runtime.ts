import { createHelloFrame } from './lib/hello';
import { appendNodesFromSchema } from './lib/nodeFactory';
import { notifyError, notifySuccess } from './lib/notifier';
import { resolvePaintToken, resolveRadiusToken, resolveTypographyToken } from './lib/tokenRegistry';
import { SchemaDocument } from './schema';
import { glossaryLayoutSample } from './samples/glossary';

const tokenResolver = (token: string) => resolvePaintToken(token);

export const SAMPLE_SCHEMA = glossaryLayoutSample;

export async function runHelloFrame() {
  const frame = await createHelloFrame();
  notifySuccess(`프레임 '${frame.name}' 생성 완료`);
}

export async function runSchemaFromString(
  raw: string,
  options?: {
    targetPage?: string;
  },
) {
  if (!raw.trim()) {
    throw new Error('JSON 스키마가 비어 있습니다.');
  }

  let doc: SchemaDocument;
  try {
    doc = JSON.parse(raw) as SchemaDocument;
  } catch (error) {
    const parseError = new Error('JSON 파싱에 실패했습니다. 형식을 확인해 주세요.');
    notifyError(parseError, parseError.message);
    throw parseError;
  }

  await runSchemaDocument(doc, options);
}

export async function runSchemaDocument(
  doc: SchemaDocument,
  options?: {
    targetPage?: string;
  },
) {
  const targetPageName =
    options?.targetPage?.trim() || doc.target.page?.trim() || figma.currentPage.name;
  const page = findTargetPage(targetPageName);

  if (doc.target.mode === 'replace') {
    removeExistingFrame(page, doc.target.frameName);
  }

  const nodes = await appendNodesFromSchema(page, doc.nodes, {
    tokenResolver,
    radiusResolver: resolveRadiusToken,
    typographyResolver: resolveTypographyToken,
  });
  figma.currentPage = page;
  figma.currentPage.selection = nodes;

  notifySuccess(doc.meta?.title ?? `${nodes.length}개 요소 생성 완료`);
}

function findTargetPage(pageName: string): PageNode {
  const match = figma.root.findOne(
    (node) => node.type === 'PAGE' && node.name === pageName,
  ) as PageNode | null;

  if (match) return match;
  throw new Error(`페이지 '${pageName}'을(를) 찾을 수 없습니다.`);
}

function removeExistingFrame(page: PageNode, frameName: string) {
  const existing = page.findOne((node) => node.type === 'FRAME' && node.name === frameName);
  existing?.remove();
}
