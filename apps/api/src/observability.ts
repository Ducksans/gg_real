/**
 * file: apps/api/src/observability.ts
 * owner: duksan
 * created: 2025-09-22 19:25 UTC / 2025-09-23 04:25 KST
 * updated: 2025-09-22 19:25 UTC / 2025-09-23 04:25 KST
 * purpose: Sentry 및 OpenTelemetry 초기화(선택 토글)
 * doc_refs: ["admin/plan/m1-kickoff.md", "basesettings.md", "apps/api/README.md"]
 */

export function configureObservability() {
  const enableSentry = process.env.ENABLE_SENTRY === 'true';
  const enableOtel = process.env.ENABLE_OTEL === 'true';

  if (enableSentry) {
    console.log(
      '[observability] Sentry 초기화는 후속 스프린트에서 구성됩니다.',
    );
  }

  if (enableOtel) {
    console.log(
      '[observability] OpenTelemetry 초기화는 후속 스프린트에서 구성됩니다.',
    );
  }
}
