/**
 * file: apps/api/src/app.controller.ts
 * owner: duksan
 * created: 2025-09-22 19:25 UTC / 2025-09-23 04:25 KST
 * updated: 2025-09-22 19:25 UTC / 2025-09-23 04:25 KST
 * purpose: 헬스체크 및 메트릭 엔드포인트 제공
 * doc_refs: ["admin/plan/m1-kickoff.md", "basesettings.md", "apps/api/README.md"]
 */

import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { AppService } from './app.service';
import { MetricsService } from './metrics.service';

@Controller()
export class AppController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly appService: AppService,
    private readonly metricsService: MetricsService,
  ) {}

  @Get('/healthz')
  @HealthCheck()
  checkHealth() {
    return this.health.check([]);
  }

  @Get('/metrics')
  async getMetrics() {
    return this.metricsService.getMetrics();
  }

  @Get('/ready')
  getReady() {
    return {
      status: 'ok',
      version: this.appService.getVersion(),
      timestamp: new Date().toISOString(),
    };
  }
}
