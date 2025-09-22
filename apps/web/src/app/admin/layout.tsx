/**
 * file: apps/web/src/app/admin/layout.tsx
 * owner: duksan
 * created: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * updated: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * purpose: 관리자 뷰 공통 레이아웃과 내비게이션을 제공
 * doc_refs: ["admin/plan/m1-kickoff.md", "basesettings.md", "apps/web/README.md"]
 */

import Link from 'next/link';
import type { ReactNode } from 'react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/wiki', label: 'Wiki' },
  { href: '/admin/timeline', label: 'Timeline' },
  { href: '/admin/graph', label: 'Graph' },
  { href: '/admin/tech-debt', label: 'Tech Debt' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-300 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold">금강부동산허브 관리자</h1>
          <ul className="flex gap-4">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link className="text-sm font-medium hover:underline" href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
