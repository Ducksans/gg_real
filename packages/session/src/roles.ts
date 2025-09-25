import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import type { UserRole } from './types.js';

export interface RoleDefinition {
  description: string;
}

export interface RoleAssignment {
  email: string;
  role: UserRole;
}

export interface RoleConfig {
  hierarchy: UserRole[];
  roles: Record<UserRole, RoleDefinition>;
  assignments: RoleAssignment[];
  defaults: {
    role: UserRole;
  };
}

let cachedConfig: RoleConfig | null = null;

const DEFAULT_CONFIG: RoleConfig = {
  hierarchy: ['viewer', 'editor', 'admin'],
  roles: {
    viewer: { description: 'Read-only access to administrative dashboards.' },
    editor: { description: 'May edit documentation and content but not system settings.' },
    admin: { description: 'Full access to administrative features and settings.' },
  },
  assignments: [],
  defaults: {
    role: 'viewer',
  },
};

export function loadRoleConfig(): RoleConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const filePath = path.resolve(process.cwd(), 'admin/config/roles.yaml');
  if (!fs.existsSync(filePath)) {
    cachedConfig = DEFAULT_CONFIG;
    return cachedConfig;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const parsed = yaml.parse(fileContent) as Partial<RoleConfig> | null;
  const hierarchy = parsed?.hierarchy ?? DEFAULT_CONFIG.hierarchy;
  cachedConfig = {
    hierarchy,
    roles: {
      ...DEFAULT_CONFIG.roles,
      ...(parsed?.roles as Record<UserRole, RoleDefinition> | undefined),
    },
    assignments: Array.isArray(parsed?.assignments)
      ? (parsed!.assignments as RoleAssignment[])
      : [],
    defaults: {
      role: parsed?.defaults?.role ?? DEFAULT_CONFIG.defaults.role,
    },
  };
  return cachedConfig;
}

export function resolveRoleForEmail(email?: string | null): UserRole {
  if (!email) {
    return loadRoleConfig().defaults.role;
  }
  const config = loadRoleConfig();
  const assignment = config.assignments.find(
    (item) => item.email.toLowerCase() === email.toLowerCase(),
  );
  return assignment?.role ?? config.defaults.role;
}

export function roleSatisfies(role: UserRole, required: UserRole): boolean {
  const { hierarchy } = loadRoleConfig();
  const value = hierarchy.indexOf(role);
  const needed = hierarchy.indexOf(required);
  if (value === -1 || needed === -1) {
    return false;
  }
  return value >= needed;
}
