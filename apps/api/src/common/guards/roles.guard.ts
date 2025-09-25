/**
 * file: apps/api/src/common/guards/roles.guard.ts
 * owner: duksan
 * created: 2025-09-25 05:55 UTC / 2025-09-25 14:55 KST
 * purpose: Enforce RBAC rules based on request headers populated by the web app middleware.
 * doc_refs: ['admin/docs/auth-rbac.md', 'admin/config/roles.yaml', 'admin/runbooks/auth.md']
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  roleSatisfies,
  resolveRoleForEmail,
  type UserRole,
} from '@gg-real/session';
import { ROLES_KEY } from './roles.decorator.js';

const ROLE_HEADER = 'x-user-role';
const EMAIL_HEADER = 'x-user-email';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<
      Request & {
        headers: Record<string, string | undefined>;
      }
    >();

    const roleHeader = request.headers[ROLE_HEADER] as UserRole | undefined;
    const emailHeader = request.headers[EMAIL_HEADER];

    const resolvedRole = roleHeader ?? resolveRoleForEmail(emailHeader);

    const hasAccess = requiredRoles.some((role) =>
      roleSatisfies(resolvedRole, role),
    );

    if (!hasAccess) {
      throw new ForbiddenException('권한이 부족합니다.');
    }

    return true;
  }
}
