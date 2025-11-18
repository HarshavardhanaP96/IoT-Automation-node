// src/types/auth.types.ts
import { z } from "zod";
import { Role, UserStatus } from "./user.types";

// Zod Schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

// Types
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    status: UserStatus;
    companyIds: string[];
    primaryCompanyId: string | null;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number; // seconds
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: Role;
  companyIds: string[];
  primaryCompanyId?: string;
  type: "access" | "refresh";
}

export interface DecodedToken {
  id: string;
  email: string;
  role: Role;
  companyIds: string[];
  primaryCompanyId?: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}
