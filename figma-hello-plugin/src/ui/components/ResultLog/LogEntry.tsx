import type { LogEntry } from '../../store';

interface LogEntryProps {
  readonly entry: LogEntry;
}

export const LogEntryCard = ({ entry }: LogEntryProps) => (
  <article class="log-entry">
    <header class="log-entry__header">
      <span class="log-entry__intent">{entry.intent.toUpperCase()}</span>
      <time dateTime={new Date(entry.timestamp).toISOString()}>
        {formatTimestamp(entry.timestamp)}
      </time>
    </header>
    <p class="log-entry__summary">{entry.summary}</p>
    <SlotReport entry={entry} />
    <GuardrailDetails entry={entry} />
    <DebugCapture entry={entry} />
  </article>
);

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

const GuardrailDetails = ({ entry }: { entry: LogEntry }) => {
  const metrics = entry.guardrail.metrics;
  const groups = [
    {
      label: 'Errors',
      items: entry.guardrail.errors,
      className: 'log-entry__issue log-entry__issue--error',
      icon: '❌',
    },
    {
      label: 'Warnings',
      items: entry.guardrail.warnings,
      className: 'log-entry__issue log-entry__issue--warning',
      icon: '⚠️',
    },
  ];

  const hasIssues = groups.some((group) => group.items.length > 0);

  return (
    <div class="log-entry__guardrail">
      <div class="log-entry__badge-row">
        <span class="log-badge log-badge--created">생성 {metrics?.created ?? 0}</span>
        <span class="log-badge log-badge--warning">
          경고 {metrics?.warnings ?? entry.guardrail.warnings.length}
        </span>
        <span class="log-badge log-badge--error">
          오류 {metrics?.errors ?? entry.guardrail.errors.length}
        </span>
      </div>
      {metrics && (
        <dl class="log-entry__metric-grid">
          <div>
            <dt>생성 노드</dt>
            <dd>{metrics.created ?? 0}</dd>
          </div>
          <div>
            <dt>경고</dt>
            <dd>{metrics.warnings ?? entry.guardrail.warnings.length}</dd>
          </div>
          <div>
            <dt>오류</dt>
            <dd>{metrics.errors ?? entry.guardrail.errors.length}</dd>
          </div>
          {typeof metrics.nodeCount === 'number' && (
            <div>
              <dt>노드 수</dt>
              <dd>{metrics.nodeCount}</dd>
            </div>
          )}
          {typeof metrics.depth === 'number' && (
            <div>
              <dt>중첩 깊이</dt>
              <dd>{metrics.depth}</dd>
            </div>
          )}
        </dl>
      )}
      {hasIssues ? (
        <div class="log-entry__issues">
          {groups.map((group) =>
            group.items.length ? (
              <section key={group.label}>
                <header>{group.label}</header>
                <ul>
                  {group.items.map((issue) => (
                    <li key={issue.id} class={group.className}>
                      {group.icon} {issue.message}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null,
          )}
        </div>
      ) : (
        <p class="log-entry__guardrail-empty">Guardrail 경고/오류가 없습니다.</p>
      )}
    </div>
  );
};

const SlotReport = ({ entry }: { entry: LogEntry }) => {
  const { slotReport } = entry;
  const hasSlotReport = Boolean(slotReport);

  return (
    <div class="log-entry__slot-report">
      <dl class="log-entry__slot-meta">
        <div>
          <dt>페이지</dt>
          <dd>{entry.page ?? '현재 페이지'}</dd>
        </div>
        <div>
          <dt>프레임</dt>
          <dd>{entry.frameName ?? 'GeneratedFrame'}</dd>
        </div>
        <div>
          <dt>슬롯</dt>
          <dd>{slotReport?.slotId ?? '미지정'}</dd>
        </div>
        <div>
          <dt>생성 개수</dt>
          <dd>{slotReport?.count ?? slotReport?.createdNodeIds.length ?? 0}</dd>
        </div>
      </dl>
      {hasSlotReport && slotReport?.createdNodeNames.length ? (
        <div class="log-entry__slot-nodes">
          <header>생성된 노드</header>
          <ul>
            {slotReport.createdNodeNames.map((name, index) => (
              <li key={`${slotReport.createdNodeIds[index] ?? name}-${index}`}>{name}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

const DebugCapture = ({ entry }: { entry: LogEntry }) => {
  const debug = entry.debug;
  if (!debug || (!debug.captureId && !debug.rawPreview)) {
    return null;
  }

  const commandId = debug.captureId ?? 'dry-run-sample';
  const command = `pnpm --filter gg-figma-plugin save:runtime-sample --id ${commandId}`;

  return (
    <section class="log-entry__debug">
      <header>디버그 캡처</header>
      <dl class="log-entry__debug-meta">
        <div>
          <dt>길이</dt>
          <dd>{debug.rawLength ?? 0}</dd>
        </div>
        <div>
          <dt>정규화</dt>
          <dd>{debug.sanitized ? '적용' : '원본 그대로'}</dd>
        </div>
        <div>
          <dt>BOM 제거</dt>
          <dd>{debug.removedBom ? '예' : '아니오'}</dd>
        </div>
        <div>
          <dt>제어문자 제거</dt>
          <dd>{debug.controlCharsRemoved ? '예' : '아니오'}</dd>
        </div>
      </dl>
      {debug.rawPreview ? (
        <div class="log-entry__debug-preview">
          <header>앞부분 미리보기</header>
          <pre>{debug.rawPreview}</pre>
        </div>
      ) : null}
      <footer class="log-entry__debug-footer">
        <span>샘플 저장 명령</span>
        <code>{command}</code>
      </footer>
    </section>
  );
};
