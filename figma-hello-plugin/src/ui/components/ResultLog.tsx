import type { LogEntry, LogStore } from '../store';

import './ResultLog/result-log.css';
import { LogEntryCard } from './ResultLog/LogEntry';

interface ResultLogProps {
  readonly logStore: LogStore;
}

export const ResultLog = ({ logStore }: ResultLogProps) => {
  const entries: LogEntry[] = logStore.state.value;

  if (entries.length === 0) {
    return (
      <section class="card result-log">
        <header class="result-log__header">
          <span>Result Log</span>
        </header>
        <p class="result-log__empty">아직 실행 기록이 없습니다.</p>
      </section>
    );
  }

  return (
    <section class="card result-log">
      <header class="result-log__header">
        <span>Result Log</span>
      </header>
      <div class="result-log__entries">
        {entries.map((entry) => (
          <LogEntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  );
};
