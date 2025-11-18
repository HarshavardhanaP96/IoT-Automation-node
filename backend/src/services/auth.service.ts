// src/services/auth.service.ts
import { PrismaClient, UserStatus } from "../generated/prisma/client";
import bcrypt from "bcrypt";
import {
  LoginInput,
  LoginResponse,
  RefreshTokenInput,
  RefreshTokenResponse,
  ChangePasswordInput,
} from "../types/auth.types";
import { AuthUser } from "../types/user.types";
import {
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../utils/errors";
import {
  generateTokenPair,
  verifyRefreshToken,
  getTokenExpiry,
  TOKEN_EXPIRY,
} from "../utils/jwt.utils";

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Login user with email and password
   */
  async login(data: LoginInput): Promise<LoginResponse> {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: data.email, deleted: false },
      include: {
        companies: {
          select: { companyId: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Check if user is suspended
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenError(
        "Your account has been suspended. Please contact support."
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Extract company IDs
    const companyIds = user.companies.map((uc) => uc.companyId);

    // Generate tokens
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role as import("../types/user.types").Role,
      companyIds,
      primaryCompanyId: user.primaryCompanyId || undefined,
    });

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() + getTokenExpiry(TOKEN_EXPIRY.REFRESH)
    );

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
      },
    });

    // Clean up old expired sessions for this user
    await this.cleanupExpiredSessions(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as import("../types/user.types").Role,
        status: user.status,
        companyIds,
        primaryCompanyId: user.primaryCompanyId,
      },
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(data: RefreshTokenInput): Promise<RefreshTokenResponse> {
    // Verify refresh token
    const decoded = verifyRefreshToken(data.refreshToken);

    // Check if refresh token exists in database
    const session = await this.prisma.session.findUnique({
      where: { refreshToken: data.refreshToken },
      include: {
        user: {
          include: {
            companies: {
              select: { companyId: true },
            },
          },
        },
      },
    });

    if (!session) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      // Delete expired session
      await this.prisma.session.delete({
        where: { id: session.id },
      });
      throw new UnauthorizedError("Refresh token has expired");
    }

    // Check if user is suspended
    if (session.user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenError("Your account has been suspended");
    }

    // Check if user is deleted
    if (session.user.deleted) {
      throw new UnauthorizedError("User account not found");
    }

    // Extract company IDs
    const companyIds = session.user.companies.map((uc) => uc.companyId);

    // Generate new token pair
    const tokens = generateTokenPair({
      id: session.user.id,
      email: session.user.email,
      role: session.user.role as import("../types/user.types").Role,
      companyIds,
    });

    // Update session with new tokens
    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() + getTokenExpiry(TOKEN_EXPIRY.REFRESH)
    );

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
      },
    });

    return tokens;
  }

  /**
   * Logout user by invalidating refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
    });

    if (session) {
      await this.prisma.session.delete({
        where: { id: session.id },
      });
    }
  }

  /**
   * Logout from all devices by deleting all sessions
   */
  async logoutAll(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  /**
   * Change user password
   */
  async changePassword(
    data: ChangePasswordInput,
    authUser: AuthUser
  ): Promise<void> {
    // Get user with password
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.id, deleted: false },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      data.currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new ValidationError("Current password is incorrect");
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(
      data.newPassword,
      user.passwordHash
    );

    if (isSamePassword) {
      throw new ValidationError(
        "New password must be different from current password"
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(data.newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: authUser.id },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate all sessions (force re-login)
    await this.logoutAll(authUser.id);
  }

  /**
   * Get current user info
   */
  async getCurrentUser(authUser: AuthUser): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.id, deleted: false },
      include: {
        companies: {
          include: {
            company: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      ...user,
      companies: user.companies.map((uc) => uc.company),
    };
  }

  /**
   * Clean up expired sessions for a user
   */
  private async cleanupExpiredSessions(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: {
        userId,
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  /**
   * Get all active sessions for a user
   */
  async getActiveSessions(userId: string): Promise<any[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        expiresAt: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return sessions;
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new NotFoundError("Session not found");
    }

    await this.prisma.session.delete({
      where: { id: sessionId },
    });
  }
}
