import type { SurfaceConfig } from '../surface-config';
import type { SchemaDocument } from '../../schema';
import { findTargetPage } from '../slot-manager';

export interface ExecutionOptions {
  readonly targetPage?: string;
  readonly targetMode?: 'append' | 'replace' | 'update';
  readonly intent?: 'dry-run' | 'apply';
}

export interface ExecutionContext {
  readonly doc: SchemaDocument;
  readonly target: Required<SchemaDocument['target']>;
  readonly page: PageNode;
  readonly surface: SurfaceConfig;
  readonly intent: 'dry-run' | 'apply';
}

export const normalizeTarget = (
  doc: SchemaDocument,
  overridePage?: string,
  overrideMode?: 'append' | 'replace' | 'update',
): Required<SchemaDocument['target']> => {
  const defaultPage = overridePage?.trim() || doc.target?.page?.trim() || figma.currentPage.name;
  const defaultFrame = doc.target?.frameName?.trim() || doc.meta?.title || 'GeneratedFrame';
  const defaultMode = overrideMode ?? doc.target?.mode ?? 'append';

  const normalized = {
    page: defaultPage,
    frameName: defaultFrame,
    mode: defaultMode,
  } as Required<SchemaDocument['target']>;

  doc.target = normalized;
  return normalized;
};

export const createExecutionContext = (
  doc: SchemaDocument,
  surface: SurfaceConfig,
  options: ExecutionOptions,
): ExecutionContext => {
  const target = normalizeTarget(doc, options.targetPage, options.targetMode);
  const page = findTargetPage(target.page);
  const intent = options.intent ?? 'apply';

  return {
    doc,
    target,
    page,
    surface,
    intent,
  };
};
