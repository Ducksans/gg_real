// doc_refs: ["admin/plan/figmapluginmake.md"]

import type { ExecutionResult } from '../store/executionStore';
import type { GuardrailState } from '../store/guardrailStore';
import type { LogEntry } from '../store/logStore';
import type { PreviewState } from '../store/previewStore';
import type { TargetState } from '../store/targetStore';

export interface CheckpointDraftInput {
  readonly latest?: LogEntry;
  readonly latestResult?: ExecutionResult;
  readonly sections: string[];
  readonly guardrail: GuardrailState;
  readonly preview: PreviewState;
  readonly target: TargetState;
}

export interface CheckpointDraft {
  readonly filename: string;
  readonly content: string;
}

const pad = (value: number) => value.toString().padStart(2, '0');

const formatUtc = (date: Date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;

const toKst = (date: Date) => new Date(date.getTime() + 9 * 60 * 60 * 1000);

const formatFilename = (utc: Date, kst: Date) => {
  const utcStamp = `${utc.getUTCFullYear()}${pad(utc.getUTCMonth() + 1)}${pad(utc.getUTCDate())}-${pad(utc.getUTCHours())}${pad(utc.getUTCMinutes())}`;
  const kstStamp = `${pad(kst.getUTCHours())}${pad(kst.getUTCMinutes())}`;
  return `${utcStamp}-UTC_${kstStamp}-KST.md`;
};

const normalizeFromLog = (entry?: LogEntry): ExecutionResult | undefined => {
  if (!entry) return undefined;
  return {
    intent: entry.intent,
    summary: entry.summary,
    page: entry.page,
    frameName: entry.frameName,
    sections: entry.slotReport?.executedSections ?? [],
    metrics: {
      created: entry.slotReport?.count ?? entry.guardrail.metrics?.created ?? 0,
      warnings: entry.guardrail.metrics?.warnings ?? entry.guardrail.warnings.length,
      errors: entry.guardrail.metrics?.errors ?? entry.guardrail.errors.length,
    },
    slotReport: entry.slotReport
      ? {
          slotId: entry.slotReport.slotId,
          createdNodeIds: entry.slotReport.createdNodeIds,
          createdNodeNames: entry.slotReport.createdNodeNames,
          warnings: entry.slotReport.warnings,
          executedSections: entry.slotReport.executedSections,
        }
      : undefined,
    timestamp: entry.timestamp,
  };
};

const uniqueList = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

export const createCheckpointDraft = (input: CheckpointDraftInput): CheckpointDraft => {
  const baseResult = input.latestResult ?? normalizeFromLog(input.latest);
  if (!baseResult) {
    throw new Error('체크포인트를 생성하려면 최근 실행 로그가 필요합니다.');
  }

  const now = new Date();
  const kst = toKst(now);
  const filename = formatFilename(now, kst);
  const createdAtUtc = formatUtc(now);
  const createdAtKst = `${kst.getUTCFullYear()}-${pad(kst.getUTCMonth() + 1)}-${pad(kst.getUTCDate())} ${pad(kst.getUTCHours())}:${pad(kst.getUTCMinutes())}`;

  const page =
    baseResult.page ??
    input.preview.page ??
    input.target.selectedPage ??
    input.target.currentPage ??
    '현재 페이지';
  const frame =
    baseResult.frameName ?? input.preview.frameName ?? input.target.frameName ?? 'GeneratedFrame';
  const slotId = baseResult.slotReport?.slotId ?? input.preview.slotId ?? '미지정';
  const sections = uniqueList([
    ...baseResult.sections,
    ...input.sections,
    ...input.preview.sections,
  ]);

  const summaryLines = [
    `- intent: ${baseResult.intent}`,
    `- page: ${page}`,
    `- frame: ${frame}`,
    `- slot: ${slotId}`,
    `- sections: ${sections.length ? sections.join(', ') : '선택 없음'}`,
    `- created: ${baseResult.metrics.created}`,
    `- warnings: ${baseResult.metrics.warnings}`,
    `- errors: ${baseResult.metrics.errors}`,
  ];

  if (baseResult.slotReport?.createdNodeNames?.length) {
    summaryLines.push(`- nodeNames: ${baseResult.slotReport.createdNodeNames.join(', ')}`);
  }

  const guardrailWarnings = input.guardrail.warnings.map((issue) => `  - ${issue.message}`);
  const guardrailErrors = input.guardrail.errors.map((issue) => `  - ${issue.message}`);

  const guardrailLines = [
    `- warnings: ${input.guardrail.warnings.length}`,
    `- errors: ${input.guardrail.errors.length}`,
  ];
  if (guardrailWarnings.length) {
    guardrailLines.push('- Warning details:');
    guardrailLines.push(...guardrailWarnings);
  }
  if (guardrailErrors.length) {
    guardrailLines.push('- Error details:');
    guardrailLines.push(...guardrailErrors);
  }

  const previewLines = [
    `- lastIntent: ${input.preview.lastIntent ?? 'N/A'}`,
    `- createdCount: ${input.preview.createdCount}`,
    `- slotId: ${input.preview.slotId ?? slotId}`,
    `- targetMode: ${input.target.mode}`,
  ];

  const followUps: string[] = [];
  if (input.guardrail.errors.length) {
    followUps.push(`- [ ] Guardrail 오류 ${input.guardrail.errors.length}건 해결`);
  }
  if (input.guardrail.warnings.length) {
    followUps.push(`- [ ] Guardrail 경고 ${input.guardrail.warnings.length}건 검토`);
  }
  if (!followUps.length) {
    followUps.push('- [ ] 추가 조치 없음 (검토 완료 시 체크)');
  }

  const description = `${baseResult.intent === 'apply' ? 'Apply' : 'Dry-run'} 결과: ${sections.length ? sections.join(', ') : '섹션 미지정'} (${page})`;
  const title = `${baseResult.intent === 'apply' ? 'Apply' : 'Dry-run'} 결과 체크포인트`;

  const frontmatter = [
    '---',
    `file: admin/checkpoints/${filename}`,
    `title: ${title}`,
    'owner: duksan',
    `created: ${createdAtUtc} UTC / ${createdAtKst} KST`,
    `updated: ${createdAtUtc} UTC / ${createdAtKst} KST`,
    'status: draft',
    'tags: [checkpoint, figma, plugin]',
    'schemaVersion: 1',
    `description: ${description}`,
    '---',
  ].join('\n');

  const content = [
    frontmatter,
    '',
    '## Summary',
    summaryLines.join('\n'),
    '',
    '## Guardrail',
    guardrailLines.join('\n'),
    '',
    '## Preview',
    previewLines.join('\n'),
    '',
    '## Follow-ups',
    followUps.join('\n'),
    '',
  ].join('\n');

  return {
    filename,
    content,
  };
};
