/**
 * file: apps/web/src/app/page.tsx
 * owner: duksan
 * created: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * updated: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * purpose: 루트 접근 시 관리자 대시보드로 리디렉션
 * doc_refs: []
 */

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/admin/dashboard');
}
