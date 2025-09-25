'use client';

/**
 * file: apps/web/src/app/admin/layout.tsx
 * owner: duksan
 * created: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * updated: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * purpose: 관리자 뷰 공통 레이아웃과 내비게이션을 제공
 * doc_refs: []
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/graph', label: 'Graph' },
  { href: '/admin/wiki', label: 'Wiki' },
  { href: '/admin/timeline', label: 'Timeline' },
  { href: '/admin/tech-debt', label: 'Tech Debt' },
];

function AdminNav() {
  const pathname = usePathname();

  return (
    <ul className="flex flex-wrap items-center gap-2 text-sm font-medium">
      {navItems.map((item) => {
        const isActive = pathname?.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              className={`inline-flex items-center rounded-full px-3 py-1 transition-colors ${
                isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
              href={item.href}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold text-slate-900">금강부동산허브 관리자</h1>
            <p className="text-xs text-slate-500">운영 현황·그래프·문서를 한 곳에서 관리합니다.</p>
          </div>
          <AdminNav />
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
