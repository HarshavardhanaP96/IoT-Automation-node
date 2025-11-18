// src/types/user.types.ts
import { z } from "zod";

export enum Role {
  VIEWER = "VIEWER",
  MANAGER = "MANAGER",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export enum UserStatus {
  ADDED = "ADDED",
  VALIDATED = "VALIDATED",
  SUSPENDED = "SUSPENDED",
}

// Zod Schemas
export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phoneNumber: z.string().optional(),
  role: z.nativeEnum(Role),
  position: z.string().optional(),
  companyIds: z.array(z.string().uuid()).optional().default([]),
  deviceIds: z.array(z.string().uuid()).optional().default([]), // Buildings/Devices
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  phoneNumber: z.string().nullable().optional(),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  position: z.string().nullable().optional(),
  companyIds: z.array(z.string().uuid()).optional(),
  deviceIds: z.array(z.string().uuid()).optional(), // Add/remove buildings
});

export const getUsersQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10"),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  search: z.string().optional(),
  companyId: z.string().uuid().optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
});

// Types
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: Role;
  status: UserStatus;
  position: string | null;
  createdAt: Date;
  updatedAt: Date;
  companies?: { id: string; name: string }[];
  devices?: { id: string; name: string; serialNumber: string }[]; // Buildings assigned
}

export interface PaginatedUsersResponse {
  users: UserResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuthUser {
  id: string;
  role: Role;
  companyIds: string[];
  primaryCompanyId?: string;
  email?: string;
  name?: string;
}
