import type { GuardrailHistoryEntry, GuardrailMetrics, GuardrailStore } from '../../store';

import './execution-panel.css';

interface GuardrailSummaryProps {
  guardrailStore: GuardrailStore;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '–';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const computeDelta = (history: GuardrailHistoryEntry[], key: keyof GuardrailMetrics) => {
  if (history.length < 2) {
    return null;
  }
  const latest = history[history.length - 1].metrics?.[key] ?? 0;
  const previous = history[history.length - 2].metrics?.[key] ?? 0;
  const delta = latest - previous;
  if (!delta) return null;
  return delta;
};

export const GuardrailSummary = ({ guardrailStore }: GuardrailSummaryProps) => {
  const { warnings, errors, metrics, history } = guardrailStore.state.value;
  const hasIssues = warnings.length > 0 || errors.length > 0;
  const warningDelta = computeDelta(history, 'warnings');
  const errorDelta = computeDelta(history, 'errors');
  const createdDelta = computeDelta(history, 'created');

  return (
    <section class="card guardrail-summary">
      <header class="guardrail-summary__header">
        <span>Guardrail 상태</span>
      </header>
      <div class="guardrail-summary__badges">
        <span class="guardrail-badge guardrail-badge--created">
          생성 {metrics?.created ?? 0}
          {createdDelta ? (
            <small>{createdDelta > 0 ? `▲${createdDelta}` : `▼${Math.abs(createdDelta)}`}</small>
          ) : null}
        </span>
        <span class="guardrail-badge guardrail-badge--warning">
          경고 {metrics?.warnings ?? warnings.length}
          {warningDelta ? (
            <small>{warningDelta > 0 ? `▲${warningDelta}` : `▼${Math.abs(warningDelta)}`}</small>
          ) : null}
        </span>
        <span class="guardrail-badge guardrail-badge--error">
          오류 {metrics?.errors ?? errors.length}
          {errorDelta ? (
            <small>{errorDelta > 0 ? `▲${errorDelta}` : `▼${Math.abs(errorDelta)}`}</small>
          ) : null}
        </span>
      </div>
      <dl class="guardrail-summary__metrics">
        <div>
          <dt>생성 노드</dt>
          <dd>{metrics?.created ?? 0}</dd>
        </div>
        <div>
          <dt>노드 수</dt>
          <dd>{metrics?.nodeCount ?? '–'}</dd>
        </div>
        <div>
          <dt>중첩 깊이</dt>
          <dd>{metrics?.depth ?? '–'}</dd>
        </div>
        <div>
          <dt>파일 크기</dt>
          <dd>{formatFileSize(metrics?.fileSize)}</dd>
        </div>
      </dl>
      {hasIssues ? (
        <div class="guardrail-summary__lists">
          {errors.length > 0 && (
            <section>
              <header>Errors</header>
              <ul>
                {errors.map((issue) => (
                  <li key={issue.id} class="guardrail-summary__item guardrail-summary__item--error">
                    ❌ {issue.message}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {warnings.length > 0 && (
            <section>
              <header>Warnings</header>
              <ul>
                {warnings.map((issue) => (
                  <li
                    key={issue.id}
                    class="guardrail-summary__item guardrail-summary__item--warning"
                  >
                    ⚠️ {issue.message}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <p class="guardrail-summary__empty">문제가 발견되지 않았습니다.</p>
      )}
      {history.length > 1 && (
        <div class="guardrail-summary__history">
          <h4>최근 실행 추세</h4>
          <ul>
            {history
              .slice(-5)
              .reverse()
              .map((entry) => (
                <li key={entry.timestamp}>
                  <span class="guardrail-history__time">
                    {entry.intent?.toUpperCase() ?? 'RUN'} ·{' '}
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  <span class="guardrail-history__stats">
                    C{entry.metrics.created ?? 0} / W{entry.metrics.warnings ?? 0} / E
                    {entry.metrics.errors ?? 0}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </section>
  );
};
