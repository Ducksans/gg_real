/**
 * file: apps/api/src/documents/documents.module.ts
 * owner: duksan
 * created: 2025-09-23 03:35 UTC / 2025-09-23 12:35 KST
 * updated: 2025-09-23 03:35 UTC / 2025-09-23 12:35 KST
 * purpose: 문서 검색 컨트롤러와 서비스를 NestJS 모듈로 묶어 제공
 * doc_refs: ["basesettings.md", "admin/plan/m1-kickoff.md", "apps/api/README.md"]
 */

import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller.js';
import { DocumentsService } from './documents.service.js';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
