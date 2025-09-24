/**
 * file: apps/api/test/run-smoke.js
 * owner: duksan
 * created: 2025-09-23 04:25 UTC / 2025-09-23 13:25 KST
 * updated: 2025-09-23 05:57 UTC / 2025-09-23 14:57 KST
 * purpose: 빌드 결과물을 활용해 DocumentsService의 목록/검색/통계 로직을 스모크 테스트
 * doc_refs: ["apps/api/README.md", "basesettings.md", "admin/plan/m1-kickoff.md"]
 */

const assert = require('node:assert/strict');
const path = require('node:path');

function loadDocumentsService() {
  const distPath = path.resolve(
    __dirname,
    '../dist/documents/documents.service.js',
  );
  // eslint-disable-next-line global-require
  const moduleExports = require(distPath);
  return moduleExports.DocumentsService;
}

async function main() {
  const DocumentsService = loadDocumentsService();
  const service = new DocumentsService();

  const list = await service.list({ limit: 5 });
  assert.ok(list.total > 0, 'list.total should be > 0');
  assert.ok(list.results.length <= 5, 'list limit respected');

  const firstTag = list.results[0]?.tags?.[0];
  if (firstTag) {
    const filtered = await service.list({ tags: [firstTag] });
    for (const item of filtered.results) {
      assert.ok(
        item.tags
          .map((tag) => tag.toLowerCase())
          .includes(firstTag.toLowerCase()),
        'filtered item should contain requested tag',
      );
    }
  }

  const search = await service.search({ query: '관리자', limit: 5 });
  assert.ok(
    Array.isArray(search.results),
    'search returns an array of results',
  );

  const stats = await service.stats();
  assert.ok(
    stats.total === list.total,
    'stats total should equal total documents',
  );

  // eslint-disable-next-line no-console
  console.log('[documents.smoke] All checks passed');
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[documents.smoke] failed', error);
  process.exit(1);
});
