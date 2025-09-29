import { createHelloFrame } from './lib/hello';
import { buildNodesFromSchema } from './lib/nodeFactory';
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

export async function runSchemaFromString(raw: string) {
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

  await runSchemaDocument(doc);
}

export async function runSchemaDocument(doc: SchemaDocument) {
  const targetPageName = doc.target.page?.trim() || figma.currentPage.name;
  const page = findTargetPage(targetPageName);
  const nodes = await buildNodesFromSchema(doc.nodes, {
    tokenResolver,
    radiusResolver: resolveRadiusToken,
    typographyResolver: resolveTypographyToken,
  });

  const targetName = doc.target.frameName;

  if (doc.target.mode === 'replace') {
    const existing = page.findOne((node) => node.type === 'FRAME' && node.name === targetName);
    existing?.remove();
  }

  nodes.forEach((node) => page.appendChild(node));
  figma.currentPage = page;
  figma.currentPage.selection = nodes;

  notifySuccess(doc.meta?.title ?? `${nodes.length}개 요소 생성 완료`);
}

function findTargetPage(pageName: string): PageNode {
  const match = figma.root.findOne(
    (node) => node.type === 'PAGE' && node.name === pageName,
  ) as PageNode | null;

  if (match) return match;
  return figma.currentPage;
}
