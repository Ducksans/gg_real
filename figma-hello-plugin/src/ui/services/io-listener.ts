// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { useEffect } from 'preact/hooks';
import type { ExecutionStore } from '../store/executionStore';
import type { GuardrailIssue, GuardrailMetrics, GuardrailStore } from '../store/guardrailStore';
import type { LogStore } from '../store/logStore';
import type { PreviewStore } from '../store/previewStore';
import type { RouteStore } from '../store/routeStore';
import type { SectionStore } from '../store/sectionStore';
import type { TargetStore } from '../store/targetStore';
import { getAvailableSections, registerArchetypeManifest } from './schema-builder';

interface ListenerDeps {
  executionStore: ExecutionStore;
  guardrailStore: GuardrailStore;
  logStore: LogStore;
  previewStore: PreviewStore;
  routeStore: RouteStore;
  sectionStore: SectionStore;
  targetStore: TargetStore;
}

interface RuntimeGuardrailPayload {
  metrics?: GuardrailMetrics;
}

interface InitPayload {
  sample?: string;
  pages?: string[];
  currentPage?: string;
  manifest?: unknown;
}

interface RuntimeResultPayload {
  intent?: 'dry-run' | 'apply';
  summary?: string;
  warnings?: string[];
  errors?: string[];
  metrics?: {
    created: number;
    warnings: number;
    errors: number;
  };
  guardrail?: RuntimeGuardrailPayload;
  page?: string;
  frameName?: string;
  sections?: string[];
  slotId?: string;
  slotReport?: {
    slotId?: string;
    createdNodes?: Array<{ id: string; name: string; type?: string }>;
    warnings?: string[];
    executedSections?: string[];
  };
  targetFrameName?: string;
}

type RuntimeMessage =
  | { type: 'init'; payload: InitPayload }
  | { type: 'dry-run-result'; payload: RuntimeResultPayload }
  | { type: 'dry-run-warning'; message: string }
  | { type: 'dry-run-error'; message: string }
  | { type: 'dry-run-success'; message: string };

const resolveRuntimeMessage = (event: MessageEvent): RuntimeMessage | null => {
  const raw = (event.data && (event.data as any).pluginMessage) ?? event.data;
  if (!raw || typeof raw !== 'object' || !('type' in raw)) {
    return null;
  }
  return raw as RuntimeMessage;
};

const toIssues = (
  messages: string[] | undefined,
  severity: GuardrailIssue['severity'],
): GuardrailIssue[] =>
  (messages ?? []).map((message, index) => ({
    id: `${severity}-${Date.now()}-${index}`,
    message,
    severity,
  }));

const handleRuntimeMessage = (message: RuntimeMessage, deps: ListenerDeps) => {
  const {
    executionStore,
    guardrailStore,
    logStore,
    previewStore,
    routeStore,
    sectionStore,
    targetStore,
  } = deps;
  switch (message.type) {
    case 'init': {
      const manifest = message.payload.manifest as
        | Parameters<typeof registerArchetypeManifest>[0]
        | undefined;
      if (manifest) {
        registerArchetypeManifest(manifest);
      }
      const sections = getAvailableSections();
      sectionStore.setAvailableSections(sections);
      sectionStore.selectSections(sections.map((section) => section.id));
      if (Array.isArray(message.payload.pages)) {
        targetStore.setPages(message.payload.pages, message.payload.currentPage);
      }
      previewStore.reset();
      previewStore.setPreview({ page: message.payload.currentPage, sections: [] });
      routeStore.load();
      break;
    }
    case 'dry-run-result': {
      const {
        intent = 'dry-run',
        summary,
        warnings,
        errors,
        metrics,
        guardrail,
        frameName,
        page,
        sections,
        slotReport,
        slotId,
        targetFrameName,
      } = message.payload;

      const summaryText = summary ?? `${intent === 'apply' ? 'Apply' : 'Dry-run'} 완료`;
      const warningIssues = toIssues(warnings, 'warning');
      const errorIssues = toIssues(errors, 'error');
      const guardrailMetrics = {
        ...guardrail?.metrics,
        created: metrics?.created,
        warnings: metrics?.warnings,
        errors: metrics?.errors,
      };

      const normalizedSlotReport = {
        slotId: slotReport?.slotId ?? slotId,
        createdNodeIds: slotReport?.createdNodes?.map((node) => node.id) ?? [],
        createdNodeNames: slotReport?.createdNodes?.map((node) => node.name) ?? [],
        warnings: slotReport?.warnings ?? [],
        executedSections: slotReport?.executedSections ?? sections ?? [],
      };

      logStore.addEntry({
        intent,
        summary: summaryText,
        guardrail: {
          warnings: warningIssues,
          errors: errorIssues,
          metrics: guardrailMetrics,
        },
        page,
        frameName: frameName ?? targetFrameName,
        slotReport: {
          ...normalizedSlotReport,
          count: normalizedSlotReport.createdNodeIds.length,
        },
      });

      guardrailStore.setSnapshot({
        warnings: warningIssues,
        errors: errorIssues,
        metrics: guardrailMetrics,
        intent,
      });

      previewStore.setPreview({
        frameName: frameName ?? targetFrameName,
        page,
        sections: sections ?? [],
        lastIntent: intent,
        slotId: normalizedSlotReport.slotId,
        createdCount: normalizedSlotReport.createdNodeIds.length,
        createdNodeNames: normalizedSlotReport.createdNodeNames,
      });

      if (sections && sections.length) {
        sectionStore.selectSections(sections);
      }

      executionStore.setResult({
        intent,
        summary: summaryText,
        page,
        frameName: frameName ?? targetFrameName,
        sections: sections ?? [],
        metrics: {
          created: metrics?.created ?? normalizedSlotReport.createdNodeIds.length,
          warnings: metrics?.warnings ?? warningIssues.length,
          errors: metrics?.errors ?? errorIssues.length,
        },
        slotReport: normalizedSlotReport,
        timestamp: Date.now(),
      });
      break;
    }
    case 'dry-run-warning':
    case 'dry-run-error':
    case 'dry-run-success':
      executionStore.setIdle();
      break;
    default:
      break;
  }
};

const addListener = (deps: ListenerDeps) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handler = (event: MessageEvent) => {
    const message = resolveRuntimeMessage(event);
    if (!message) return;
    handleRuntimeMessage(message, deps);
  };

  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
};

export const useRuntimeListener = (deps: ListenerDeps) => {
  useEffect(
    () => addListener(deps),
    [
      deps.executionStore,
      deps.guardrailStore,
      deps.logStore,
      deps.previewStore,
      deps.routeStore,
      deps.sectionStore,
      deps.targetStore,
    ],
  );
};

export const attachRuntimeListener = (deps: ListenerDeps) => addListener(deps);
