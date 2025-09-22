/**
 * file: apps/web/src/app/admin/page.tsx
 * owner: duksan
 * created: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * updated: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * purpose: 관리자 루트 인덱스 안내 페이지
 * doc_refs: []
 */

import Link from 'next/link';

export default function AdminIndex() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">관리자 대시보드로 이동하세요</h2>
      <p className="text-sm text-slate-600">
        좌측 내비게이션이 준비되기 전까지는 아래 링크를 통해 주요 화면으로 이동할 수 있습니다.
      </p>
      <Link className="text-sm font-medium text-blue-600 hover:underline" href="/admin/dashboard">
        관리자 Dashboard 보기
      </Link>
    </section>
  );
}
