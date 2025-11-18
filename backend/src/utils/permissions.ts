// src/utils/permissions.ts
import { Role } from "../../src/generated/prisma";

/**
 * Role hierarchy levels
 */
export const ROLE_HIERARCHY = {
  [Role.VIEWER]: 0,
  [Role.MANAGER]: 1,
  [Role.ADMIN]: 2,
  [Role.SUPER_ADMIN]: 3,
} as const;

/**
 * Permission matrix for user operations
 */
export const PERMISSIONS: Record<string, Role[]> = {
  // View permissions
  VIEW_OWN_PROFILE: [Role.VIEWER, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN],
  VIEW_COMPANY_USERS: [Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN],
  VIEW_ALL_USERS: [Role.SUPER_ADMIN],

  // Create permissions
  CREATE_VIEWER: [Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN],
  CREATE_MANAGER: [Role.ADMIN, Role.SUPER_ADMIN],
  CREATE_ADMIN: [Role.SUPER_ADMIN],

  // Update permissions (requires same company check)
  UPDATE_VIEWER: [Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN],
  UPDATE_MANAGER: [Role.ADMIN, Role.SUPER_ADMIN],
  UPDATE_ADMIN: [Role.SUPER_ADMIN],

  // Delete permissions (requires same company check)
  DELETE_VIEWER: [Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN],
  DELETE_MANAGER: [Role.ADMIN, Role.SUPER_ADMIN],
  DELETE_ADMIN: [Role.SUPER_ADMIN],
} as const;

/**
 * Check if a role can perform an action on another role
 */
export function canManageRole(
  actorRole: Role,
  targetRole: Role,
  action: "create" | "update" | "delete"
): boolean {
  const actionMap: Record<
    "create" | "update" | "delete",
    Record<Role, Role[]>
  > = {
    create: {
      [Role.SUPER_ADMIN]: [
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.MANAGER,
        Role.VIEWER,
      ],
      [Role.ADMIN]: [Role.MANAGER, Role.VIEWER],
      [Role.MANAGER]: [Role.VIEWER],
      [Role.VIEWER]: [],
    },
    update: {
      [Role.SUPER_ADMIN]: [
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.MANAGER,
        Role.VIEWER,
      ],
      [Role.ADMIN]: [Role.MANAGER, Role.VIEWER],
      [Role.MANAGER]: [Role.VIEWER],
      [Role.VIEWER]: [],
    },
    delete: {
      [Role.SUPER_ADMIN]: [Role.ADMIN, Role.MANAGER, Role.VIEWER],
      [Role.ADMIN]: [Role.MANAGER, Role.VIEWER],
      [Role.MANAGER]: [Role.VIEWER],
      [Role.VIEWER]: [],
    },
  };

  return actionMap[action][actorRole]?.includes(targetRole) ?? false;
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: Role,
  permission: keyof typeof PERMISSIONS
): boolean {
  return PERMISSIONS[permission].includes(role);
}

/**
 * Get the highest role a user can create
 */
export function getMaxCreatableRole(role: Role): Role | null {
  switch (role) {
    case Role.SUPER_ADMIN:
      return Role.SUPER_ADMIN;
    case Role.ADMIN:
      return Role.MANAGER;
    case Role.MANAGER:
      return Role.VIEWER;
    default:
      return null;
  }
}
