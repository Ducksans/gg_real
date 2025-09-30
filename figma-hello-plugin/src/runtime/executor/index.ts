import { createHelloFrame } from '../../lib/hello';
import { notifyError, notifySuccess, notifyWarning, sendDryRunResult } from '../../lib/notifier';
import {
  resolvePaintStyleId,
  resolvePaintToken,
  resolveRadiusToken,
  resolveTypographyToken,
} from '@lib/tokenRegistry';
import type { NodeSpec, SchemaDocument } from '../../schema';
import { resolveSurfaceConfig } from '../surface-config';
import {
  findTargetPage,
  removeExistingFrame,
  prepareTargetFrame,
  applySurfaceLayout,
  ensureSlotContainer,
  resolveSlotContainer,
  syncSlotChildren,
} from '../slot-manager';
import { evaluateGuardrails } from '../guardrails';
import { normalizeSlotName, PLUGINDATA_KEYS } from '../utils';

import { createExecutionContext, type ExecutionOptions } from './context-factory';

const tokenResolver = (token: string) => resolvePaintToken(token);

export async function runHelloFrame() {
  const frame = await createHelloFrame();
  notifySuccess(`프레임 '${frame.name}' 생성 완료`);
}

const handleGuardrails = (doc: SchemaDocument, rawLength: number, surfaceId: string) => {
  const surface = resolveSurfaceConfig({ designSurface: surfaceId } as SchemaDocument['meta']);
  return evaluateGuardrails(doc, rawLength, surface);
};

export async function runSchemaFromString(raw: string, options: ExecutionOptions = {}) {
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

  await runSchemaDocument(doc, options, undefined);
}

export async function runSchemaBatch(raws: string[], options: ExecutionOptions = {}) {
  if (!raws.length) {
    throw new Error('선택된 섹션이 없습니다.');
  }

  const parsed = raws.map((raw) => {
    let doc: SchemaDocument;
    try {
      doc = JSON.parse(raw) as SchemaDocument;
    } catch (error) {
      throw new Error('JSON 파싱에 실패했습니다. 형식을 확인해 주세요.');
    }
    return doc;
  });

  for (const doc of parsed) {
    await runSchemaDocument(doc, options);
  }
}

export async function runSchemaDocument(
  doc: SchemaDocument,
  options: ExecutionOptions = {},
  guardInfo?: { warnings: string[]; errors: string[] },
  containerOverride?: FrameNode,
  surfaceOverride?: ReturnType<typeof resolveSurfaceConfig>,
  slotOverride?: string | null,
): Promise<SceneNode[]> {
  const surface = surfaceOverride ?? resolveSurfaceConfig(doc.meta);
  const rawString = JSON.stringify(doc);
  const guard = guardInfo ?? evaluateGuardrails(doc, rawString.length, surface);

  if (guard.errors.length) {
    guard.errors.forEach((message) => notifyError(new Error(message), message));
    throw new Error(guard.errors.join('\n'));
  }

  guard.warnings.forEach((message) => notifyWarning(message));

  const context = createExecutionContext(doc, surface, options);
  const normalized = context.target;
  const isPreview = context.intent === 'dry-run';

  if (isPreview && !normalized.frameName.endsWith('_preview')) {
    normalized.frameName = `${normalized.frameName}_preview`;
    doc.target.frameName = normalized.frameName;
  }

  const page = containerOverride
    ? ((containerOverride.parent as PageNode | null) ?? findTargetPage(normalized.page))
    : findTargetPage(normalized.page);

  if (!doc.nodes || doc.nodes.length === 0) {
    throw new Error('nodes 배열이 비어 있어 실행할 수 없습니다.');
  }

  if (!containerOverride && (options.targetMode === 'replace' || isPreview)) {
    removeExistingFrame(page, normalized.frameName);
  }

  const baseContainer = containerOverride ?? prepareTargetFrame(page, normalized, surface);
  if (!containerOverride) {
    applySurfaceLayout(baseContainer, surface);
  }

  const slotId = slotOverride ?? normalizeSlotName(doc.meta?.slot);
  const slotTarget = resolveSlotContainer(baseContainer, slotId, surface);

  const createdNodes = await syncSlotChildren(
    slotTarget,
    doc.nodes as NodeSpec[],
    {
      tokenResolver,
      paintStyleResolver: resolvePaintStyleId,
      radiusResolver: resolveRadiusToken,
      typographyResolver: resolveTypographyToken,
    },
    surface,
    slotId,
    isPreview ? 'replace' : options.targetMode === 'replace' ? 'replace' : 'append',
  );

  if (!options?.intent || options.intent !== 'dry-run') {
    figma.currentPage = page;
    if (createdNodes.length) {
      figma.currentPage.selection = createdNodes;
    } else {
      figma.currentPage.selection = [];
    }
    const message = doc.meta?.title ?? `${createdNodes.length}개 요소 생성 완료`;
    notifySuccess(message);
  }

  const summary = doc.meta?.title ?? `${createdNodes.length}개 요소 생성 완료`;

  sendDryRunResult({
    intent: context.intent,
    summary,
    page: normalized.page,
    frameName: normalized.frameName,
    sections: doc.meta?.section ? [doc.meta.section] : [],
    metrics: {
      created: createdNodes.length,
      warnings: guard.warnings.length,
      errors: guard.errors.length,
    },
    warnings: guard.warnings,
    errors: guard.errors,
  });

  return createdNodes;
}
