// doc_refs: ["admin/plan/figmapluginmake.md", "admin/docs/execution-contract.md"]

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
  buildSlotReport,
} from '../slot-manager';
import { evaluateGuardrails } from '../guardrails';
import { normalizeSlotName, PLUGINDATA_KEYS } from '../utils';

import { createExecutionContext, type ExecutionOptions } from './context-factory';

const tokenResolver = (token: string) => resolvePaintToken(token);

const CONTROL_CHAR_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;
const RAW_PREVIEW_LENGTH = 400;

interface RawNormalizationResult {
  sanitized: string;
  preview: string;
  length: number;
  removedBom: boolean;
  trimmed: boolean;
  controlCharsRemoved: boolean;
  changed: boolean;
}

interface RawDebugPayload {
  captureId: string;
  stage: 'parse';
  rawPreview: string;
  rawLength: number;
  sanitized: boolean;
  removedBom: boolean;
  controlCharsRemoved: boolean;
}

const normalizeRawPayload = (raw: string): RawNormalizationResult => {
  let sanitized = typeof raw === 'string' ? raw : '';
  let removedBom = false;
  if (sanitized.startsWith('\uFEFF')) {
    sanitized = sanitized.slice(1);
    removedBom = true;
  }

  const trimmedValue = sanitized.trim();
  const trimmed = trimmedValue.length !== sanitized.length;
  sanitized = trimmedValue;

  let controlCharsRemoved = false;
  CONTROL_CHAR_REGEX.lastIndex = 0;
  if (CONTROL_CHAR_REGEX.test(sanitized)) {
    sanitized = sanitized.replace(CONTROL_CHAR_REGEX, '');
    controlCharsRemoved = true;
  }

  return {
    sanitized,
    preview: sanitized.slice(0, RAW_PREVIEW_LENGTH),
    length: sanitized.length,
    removedBom,
    trimmed,
    controlCharsRemoved,
    changed: removedBom || trimmed || controlCharsRemoved,
  };
};

const logRawCapture = (debug: RawDebugPayload, preview: string) => {
  console.error('[plugin:raw-capture]', {
    captureId: debug.captureId,
    stage: debug.stage,
    rawLength: debug.rawLength,
    sanitized: debug.sanitized,
    removedBom: debug.removedBom,
    controlCharsRemoved: debug.controlCharsRemoved,
  });
  if (preview) {
    console.error('[plugin:raw-capture][preview]', preview);
  }
  console.error(
    `[plugin:raw-capture] 샘플을 보관하려면 JSON을 복사한 뒤 "pnpm --filter gg-figma-plugin save:runtime-sample --id ${debug.captureId}" 명령에 붙여넣어 주세요.`,
  );
};

export async function runHelloFrame() {
  const frame = await createHelloFrame();
  notifySuccess(`프레임 '${frame.name}' 생성 완료`);
}

const handleGuardrails = (doc: SchemaDocument, rawLength: number, surfaceId: string) => {
  const surface = resolveSurfaceConfig({ designSurface: surfaceId } as SchemaDocument['meta']);
  return evaluateGuardrails(doc, rawLength, surface);
};

export async function runSchemaFromString(raw: string, options: ExecutionOptions = {}) {
  const intent = options.intent ?? 'dry-run';
  const normalized = normalizeRawPayload(raw);

  if (!normalized.sanitized) {
    throw new Error('JSON 스키마가 비어 있습니다.');
  }

  let doc: SchemaDocument;
  try {
    doc = JSON.parse(normalized.sanitized) as SchemaDocument;
  } catch (error) {
    const parseError = new Error('JSON 파싱에 실패했습니다. 형식을 확인해 주세요.');
    const captureId = `dry-run-${Date.now()}`;
    const debug: RawDebugPayload = {
      captureId,
      stage: 'parse',
      rawPreview: normalized.preview,
      rawLength: normalized.length,
      sanitized: normalized.changed,
      removedBom: normalized.removedBom,
      controlCharsRemoved: normalized.controlCharsRemoved,
    };

    logRawCapture(debug, normalized.preview);
    sendDryRunResult({
      intent,
      summary: 'JSON 파싱 실패',
      errors: [parseError.message],
      metrics: { created: 0, warnings: 0, errors: 1 },
      debug,
    });
    notifyError(parseError, parseError.message);
    throw parseError;
  }

  await runSchemaDocument(doc, options, undefined);
}

const EXECUTION_DOCUMENT_ERROR = 'ExecutionPayload.documents must be stringified JSON strings.';

export async function runSchemaBatch(raws: string[], options: ExecutionOptions = {}) {
  if (!raws.length) {
    throw new Error('선택된 섹션이 없습니다.');
  }

  const sanitizedRaws = raws.map((raw, index) => {
    if (typeof raw !== 'string') {
      throw new Error(`${EXECUTION_DOCUMENT_ERROR} (index ${index})`);
    }

    const trimmed = raw.trim();
    if (!trimmed) {
      throw new Error(`${EXECUTION_DOCUMENT_ERROR} (index ${index} is empty)`);
    }

    return trimmed;
  });

  const parsed = sanitizedRaws.map((raw) => {
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
    const slotId = slotOverride ?? normalizeSlotName(doc.meta?.slot);
    sendDryRunResult({
      intent: options.intent ?? 'apply',
      summary: doc.meta?.title ?? 'Guardrail 검증 실패',
      page: doc.target?.page ?? options.targetPage,
      frameName: doc.target?.frameName,
      sections: [],
      slotId,
      slotReport: {
        slotId,
        executedSections: [],
        warnings: [],
        createdNodes: [],
      },
      metrics: {
        created: 0,
        warnings: guard.warnings.length,
        errors: guard.errors.length,
      },
      warnings: guard.warnings,
      errors: guard.errors,
      guardrail: {
        metrics: guard.metrics,
      },
    });
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

  const baseContainer =
    containerOverride ?? prepareTargetFrame(page, normalized, surface, context.intent);
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

  const slotReport = buildSlotReport(createdNodes, doc.meta?.section ? [doc.meta.section] : [], []);

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
  const guardMetrics = 'metrics' in guard ? guard.metrics : undefined;

  sendDryRunResult({
    intent: context.intent,
    summary,
    page: normalized.page,
    frameName: normalized.frameName,
    sections: doc.meta?.section ? [doc.meta.section] : [],
    slotId,
    slotReport: {
      slotId,
      executedSections: slotReport.executedSections,
      warnings: slotReport.warnings,
      createdNodes: slotReport.createdNodes.map((node) => ({
        id: node.id,
        name: node.name,
        type: node.type,
      })),
    },
    metrics: {
      created: createdNodes.length,
      warnings: guard.warnings.length,
      errors: guard.errors.length,
    },
    warnings: guard.warnings,
    errors: guard.errors,
    guardrail: {
      metrics: guardMetrics,
    },
  });

  return createdNodes;
}
