'use client';

/**
 * file: apps/web/src/app/admin/layout.tsx
 * owner: duksan
 * created: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * updated: 2025-09-25 13:05 UTC / 2025-09-25 22:05 KST
 * purpose: 관리자 뷰 공통 레이아웃과 내비게이션을 제공하며 Figma(36-176) 상단 헤더 스타일을 재현
 * doc_refs: ['basesettings.md']
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const navItems = [
  { href: '/admin/dashboard', label: '관리자 대시보드' },
  { href: '/admin/graph', label: '사이트 구조 그래프' },
  { href: '/admin/wiki', label: 'WIKI / 사이트 백과' },
  { href: '/admin/timeline', label: '사이트 개발 타임라인' },
  { href: '/admin/dev-journal', label: '사이트 개발 중 기술 부채' },
  { href: '/admin/agents', label: '에이전트 / 생성, 관리' },
  { href: '/admin/workflows', label: '워크플로우 / 생성, 관리' },
  { href: '/admin/automation', label: '컨텐츠 자동화' },
];

function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex w-full items-center justify-between gap-6 whitespace-nowrap text-[13px] font-semibold uppercase tracking-[0.08em] text-[#3f3f3f]">
      {navItems.map((item) => {
        const isActive = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative px-2 transition-colors ${
              isActive
                ? 'text-[#1f1f1f] after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-[2px] after:bg-[#1a1a1a]'
                : 'hover:text-[#1f1f1f]'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-slate-900">
      <header className="border-t-[12px] border-black bg-[#d7d7d7]">
        <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between px-10 py-3">
          <AdminNav />
          <label className="relative flex items-center">
            <span className="sr-only">관리 문서 검색</span>
            <div className="relative flex items-center">
              <svg
                className="pointer-events-none absolute left-3 h-4 w-4 text-[#6d6d6d]"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m15.75 15.75-3.5-3.5m1.75-3.25a5 5 0 1 1-10.001 0 5 5 0 0 1 10 0Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                type="search"
                className="w-[240px] rounded-full border border-[#bfbfbf] bg-white py-2 pl-9 pr-3 text-sm text-[#303030] placeholder:text-[#868686] focus:border-[#4a4a4a] focus:outline-none focus:ring-1 focus:ring-[#bfbfbf]"
                placeholder="검색..."
                autoComplete="off"
              />
            </div>
          </label>
        </div>
      </header>
      <main className="flex-1 bg-white">
        <div className="mx-auto w-full max-w-[1920px] px-10 py-10">{children}</div>
      </main>
    </div>
  );
}
