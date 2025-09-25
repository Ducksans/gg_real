/**
 * file: apps/api/src/app.module.ts
 * owner: duksan
 * created: 2025-09-22 19:25 UTC / 2025-09-23 04:25 KST
 * updated: 2025-09-23 03:35 UTC / 2025-09-23 12:35 KST
 * purpose: 관리자 API 루트 모듈 — 헬스/메트릭 엔드포인트 및 관측 토글 구성
 * doc_refs: ["admin/plan/m1-kickoff.md", "basesettings.md", "apps/api/README.md"]
 */

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MetricsService } from './metrics.service';
import { DocumentsModule } from './documents/documents.module';
import { RolesGuard } from './common/guards/roles.guard.js';

@Module({
  imports: [TerminusModule, DocumentsModule],
  controllers: [AppController],
  providers: [
    AppService,
    MetricsService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
