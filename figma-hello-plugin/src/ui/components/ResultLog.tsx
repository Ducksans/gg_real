// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import type { LogStore, LogEntry } from '../store';

interface ResultLogProps {
  logStore: LogStore;
}

export const ResultLog = ({ logStore }: ResultLogProps) => {
  const entries: LogEntry[] = logStore.state.value;

  if (entries.length === 0) {
    return (
      <section class="panel">
        <header class="panel__header">
          <h2>Result Log</h2>
        </header>
        <div class="panel__content">
          <p class="panel__empty">아직 실행 기록이 없습니다.</p>
        </div>
      </section>
    );
  }

  return (
    <section class="panel">
      <header class="panel__header">
        <h2>Result Log</h2>
      </header>
      <div class="panel__content panel__content--scroll">
        {entries.map((entry: LogEntry) => (
          <article key={entry.id} class="log-entry">
            <header class="log-entry__header">
              <span class="log-entry__intent">{entry.intent.toUpperCase()}</span>
              <time dateTime={new Date(entry.timestamp).toISOString()}>
                {new Date(entry.timestamp).toLocaleString()}
              </time>
            </header>
            <p class="log-entry__summary">{entry.summary}</p>
            {entry.warnings.length > 0 && (
              <ul class="log-entry__warnings">
                {entry.warnings.map((warn: string, index: number) => (
                  <li key={index}>⚠️ {warn}</li>
                ))}
              </ul>
            )}
            {entry.errors.length > 0 && (
              <ul class="log-entry__errors">
                {entry.errors.map((error: string, index: number) => (
                  <li key={index}>❌ {error}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};
