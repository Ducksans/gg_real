/**
 * file: apps/web/src/middleware.ts
 * owner: duksan
 * created: 2025-09-25 05:55 UTC / 2025-09-25 14:55 KST
 * purpose: /admin 경로 접근 시 Auth.js 세션과 역할을 검사하고 필요한 헤더를 주입하는 Next.js 미들웨어
 * doc_refs: ['admin/docs/auth-rbac.md', 'admin/config/roles.yaml', 'admin/runbooks/auth.md']
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { UserRole } from '@gg-real/session';

const ADMIN_ROUTE_ROLE: Array<{ prefix: string; role: UserRole }> = [
  { prefix: '/admin/wiki', role: 'editor' },
  { prefix: '/admin', role: 'viewer' },
];

export const config = {
  matcher: ['/admin/:path*'],
};

const ROLE_PRIORITY: Record<UserRole, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
};

function requiredRoleForPath(pathname: string): UserRole {
  const match = ADMIN_ROUTE_ROLE.find(({ prefix }) => pathname.startsWith(prefix));
  return match?.role ?? 'viewer';
}

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  if (!token?.email) {
    const redirectUrl = new URL('/api/auth/signin', request.url);
    redirectUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  const role = (token.role as UserRole | undefined) ?? 'viewer';
  const requiredRole = requiredRoleForPath(request.nextUrl.pathname);
  if (ROLE_PRIORITY[role] < ROLE_PRIORITY[requiredRole]) {
    const unauthorizedUrl = new URL('/admin/unauthorized', request.url);
    unauthorizedUrl.searchParams.set('require', requiredRole);
    return NextResponse.redirect(unauthorizedUrl);
  }

  const response = NextResponse.next();
  response.headers.set('x-user-role', role);
  response.headers.set('x-user-email', token.email ?? '');
  return response;
}
