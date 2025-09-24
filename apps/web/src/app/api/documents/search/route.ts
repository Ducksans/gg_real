/**
 * file: apps/web/src/app/api/documents/search/route.ts
 * owner: duksan
 * created: 2025-09-23 03:32 UTC / 2025-09-23 12:32 KST
 * updated: 2025-09-23 03:32 UTC / 2025-09-23 12:32 KST
 * purpose: 관리자 문서 검색 API를 Next.js 라우트 핸들러로 제공
 * doc_refs: ["basesettings.md", "admin/plan/m1-kickoff.md", "apps/web/README.md"]
 */

import { NextResponse } from 'next/server';
import { searchDocuments } from '@/lib/content';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') ?? '';
  const tags = searchParams.getAll('tag').filter(Boolean);
  const limit = parsePositiveInt(searchParams.get('limit')) ?? 20;
  const offset = parsePositiveInt(searchParams.get('offset')) ?? 0;

  const result = await searchDocuments({
    query,
    tags,
    limit,
    offset,
  });

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

function parsePositiveInt(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}
