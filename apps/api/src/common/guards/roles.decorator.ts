/**
 * file: apps/api/src/common/guards/roles.decorator.ts
 * owner: duksan
 * created: 2025-09-25 05:55 UTC / 2025-09-25 14:55 KST
 * purpose: NestJS metadata decorator to attach required roles on handlers.
 * doc_refs: ['admin/docs/auth-rbac.md']
 */

import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@gg-real/session';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
