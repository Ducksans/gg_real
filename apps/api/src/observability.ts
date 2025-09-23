/**
 * file: apps/api/src/observability.ts
 * owner: duksan
 * created: 2025-09-22 19:25 UTC / 2025-09-23 04:25 KST
 * updated: 2025-09-23 06:07 UTC / 2025-09-23 15:08 KST
 * purpose: Sentry 및 OpenTelemetry 초기화(선택 토글)
 * doc_refs: ["admin/plan/m1-kickoff.md", "basesettings.md", "apps/api/README.md"]
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

let telemetrySdk: NodeSDK | null = null;
let sentryEnabled = false;

export function configureObservability(): void {
  setupSentry();
  setupOpenTelemetry();
}

function setupSentry() {
  const enableSentry = process.env.ENABLE_SENTRY === 'true';
  const dsn = process.env.SENTRY_DSN;

  if (!enableSentry || !dsn) {
    if (enableSentry) {
      console.warn(
        '[observability] ENABLE_SENTRY=true 이지만 SENTRY_DSN이 비어 있습니다.',
      );
    }
    return;
  }

  if (sentryEnabled) {
    return;
  }

  const tracesSampleRate = Number.parseFloat(
    process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1',
  );
  const profilesSampleRate = Number.parseFloat(
    process.env.SENTRY_PROFILES_SAMPLE_RATE ?? '0.1',
  );

  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number.isNaN(tracesSampleRate) ? 0.1 : tracesSampleRate,
    profilesSampleRate: Number.isNaN(profilesSampleRate)
      ? 0.1
      : profilesSampleRate,
    integrations: [nodeProfilingIntegration()],
  });

  sentryEnabled = true;

  const shutdown = async () => {
    try {
      await Sentry.close(2000);
    } catch (error) {
      console.error('[observability] Sentry flush 실패', error);
    }
  };

  process.once('beforeExit', () => {
    void shutdown();
  });
  process.once('SIGTERM', () => {
    void shutdown();
  });
  process.once('SIGINT', () => {
    void shutdown();
  });

  console.log('[observability] Sentry가 활성화되었습니다.');
}

function setupOpenTelemetry() {
  const enableOtel = process.env.ENABLE_OTEL === 'true';

  if (!enableOtel) {
    return;
  }

  if (telemetrySdk) {
    return;
  }

  const serviceName = process.env.OTEL_SERVICE_NAME ?? 'gg-real-api';
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const otlpHeaders = parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS);

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
      process.env.NODE_ENV ?? 'development',
  });

  const exporter = otlpEndpoint
    ? new OTLPTraceExporter({ url: otlpEndpoint, headers: otlpHeaders })
    : new ConsoleSpanExporter();

  telemetrySdk = new NodeSDK({
    resource,
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  void (async () => {
    try {
      await telemetrySdk?.start();
      console.log('[observability] OpenTelemetry 트레이싱이 활성화되었습니다.');
    } catch (error) {
      console.error('[observability] OpenTelemetry 초기화 실패', error);
    }
  })();

  const shutdown = async () => {
    if (!telemetrySdk) {
      return;
    }
    try {
      await telemetrySdk.shutdown();
    } catch (error) {
      console.error('[observability] OpenTelemetry 종료 실패', error);
    }
  };

  process.once('beforeExit', () => {
    void shutdown();
  });
  process.once('SIGTERM', () => {
    void shutdown();
  });
  process.once('SIGINT', () => {
    void shutdown();
  });
}

function parseHeaders(value?: string): Record<string, string> | undefined {
  if (!value) {
    return undefined;
  }

  return value
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, pair) => {
      const [key, headerValue] = pair.split('=');
      if (key && headerValue) {
        acc[key.trim()] = headerValue.trim();
      }
      return acc;
    }, {});
}
