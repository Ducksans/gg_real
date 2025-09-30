// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import type { GuardrailStore } from '../../store';

interface GuardrailSummaryProps {
  guardrailStore: GuardrailStore;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '–';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const GuardrailSummary = ({ guardrailStore }: GuardrailSummaryProps) => {
  const { warnings, errors, metrics } = guardrailStore.state.value;
  const hasIssues = warnings.length > 0 || errors.length > 0;

  return (
    <div class="guardrail-summary">
      <h3 class="guardrail-summary__title">Guardrail 상태</h3>
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
    </div>
  );
};
