/**
 * file: apps/api/src/metrics.service.ts
 * owner: duksan
 * created: 2025-09-22 19:25 UTC / 2025-09-23 04:25 KST
 * updated: 2025-09-22 19:25 UTC / 2025-09-23 04:25 KST
 * purpose: 간단한 메트릭 수집/노출 로직
 * doc_refs: ["admin/plan/m1-kickoff.md", "basesettings.md", "apps/api/README.md"]
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  async getMetrics(): Promise<Record<string, unknown>> {
    return {
      service: 'gg-real-admin-api',
      uptime: process.uptime(),
      timestamp: Date.now(),
      memory: process.memoryUsage(),
    };
  }
}
