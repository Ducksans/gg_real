/**
 * file: apps/api/src/documents/documents.controller.ts
 * owner: duksan
 * created: 2025-09-23 03:35 UTC / 2025-09-23 12:35 KST
 * updated: 2025-09-23 03:35 UTC / 2025-09-23 12:35 KST
 * purpose: 문서 검색 HTTP 엔드포인트를 제공하는 NestJS 컨트롤러
 * doc_refs: ["basesettings.md", "admin/plan/m1-kickoff.md", "apps/api/README.md"]
 */

import { Controller, Get, Query } from '@nestjs/common';
import type { DocumentSearchResponse } from '@gg-real/documents';
import { DocumentsService } from './documents.service.js';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('search')
  async search(
    @Query('q') query?: string,
    @Query('tag') tag?: string | string[],
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<DocumentSearchResponse> {
    const tags = normalizeTagQuery(tag);
    const limitValue = parsePositiveInt(limit) ?? 20;
    const offsetValue = parsePositiveInt(offset) ?? 0;

    return this.documentsService.search({
      query,
      tags,
      limit: limitValue,
      offset: offsetValue,
    });
  }
}

function normalizeTagQuery(tag?: string | string[]): string[] {
  if (!tag) {
    return [];
  }
  return (Array.isArray(tag) ? tag : [tag]).filter((value) => value.length > 0);
}

function parsePositiveInt(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}
