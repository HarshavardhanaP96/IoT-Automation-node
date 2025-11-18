// src/types/enums.ts

// User Roles - Must match backend exactly
export enum Role {
  VIEWER = "VIEWER",
  MANAGER = "MANAGER",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

// User Status - Must match backend exactly
export enum UserStatus {
  ADDED = "ADDED",
  VALIDATED = "VALIDATED",
  SUSPENDED = "SUSPENDED",
}

// Device Types
export enum DeviceType {
  GATE_WAY = "GATE_WAY",
  SENSOR = "SENSOR",
}

// Helper functions for display
export const getRoleLabel = (role: Role): string => {
  const labels: Record<Role, string> = {
    [Role.VIEWER]: "Viewer",
    [Role.MANAGER]: "Manager",
    [Role.ADMIN]: "Admin",
    [Role.SUPER_ADMIN]: "Super Admin",
  };
  return labels[role];
};

export const getStatusLabel = (status: UserStatus): string => {
  const labels: Record<UserStatus, string> = {
    [UserStatus.ADDED]: "Added",
    [UserStatus.VALIDATED]: "Validated",
    [UserStatus.SUSPENDED]: "Suspended",
  };
  return labels[status];
};

export const getRoleColor = (role: Role): string => {
  const colors: Record<Role, string> = {
    [Role.VIEWER]: "bg-gray-100 text-gray-800",
    [Role.MANAGER]: "bg-blue-100 text-blue-800",
    [Role.ADMIN]: "bg-purple-100 text-purple-800",
    [Role.SUPER_ADMIN]: "bg-red-100 text-red-800",
  };
  return colors[role];
};

export const getStatusColor = (status: UserStatus): string => {
  const colors: Record<UserStatus, string> = {
    [UserStatus.ADDED]: "bg-yellow-100 text-yellow-800",
    [UserStatus.VALIDATED]: "bg-green-100 text-green-800",
    [UserStatus.SUSPENDED]: "bg-red-100 text-red-800",
  };
  return colors[status];
};
