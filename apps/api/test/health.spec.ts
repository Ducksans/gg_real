/**
 * file: apps/api/test/health.spec.ts
 * owner: duksan
 * created: 2025-09-22 19:32 UTC / 2025-09-23 04:32 KST
 * updated: 2025-09-22 19:32 UTC / 2025-09-23 04:32 KST
 * purpose: /healthz, /ready, /metrics 엔드포인트 호출 테스트
 * doc_refs: ["apps/api/README.md"]
 */

export async function runHealthChecks(baseUrl: string) {
  const endpoints = ['/healthz', '/ready', '/metrics'] as const;
  for (const endpoint of endpoints) {
    const url = `${baseUrl}${endpoint}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Endpoint ${endpoint} responded with ${response.status}`);
    }
  }
}
