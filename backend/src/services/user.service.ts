// src/services/user.service.ts
import { PrismaClient } from "../generated/prisma";
import { Role } from "../../src/generated/prisma";
import type {
  CreateUserInput,
  UpdateUserInput,
  GetUsersQuery,
  AuthUser,
  UserResponse,
  PaginatedUsersResponse,
} from "../types/user.types";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from "../utils/errors";
import bcrypt from "bcrypt";

export class UserService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Check if the authenticated user can perform actions on a target user
   */
  private canManageUser(authUser: AuthUser, targetRole: Role): boolean {
    const roleHierarchy = {
      [Role.VIEWER]: 0,
      [Role.MANAGER]: 1,
      [Role.ADMIN]: 2,
      [Role.SUPER_ADMIN]: 3,
    };

    // SUPER_ADMIN can manage anyone
    if (authUser.role === Role.SUPER_ADMIN) return true;

    // ADMIN can manage MANAGER and VIEWER
    if (authUser.role === Role.ADMIN) {
      return ([Role.MANAGER, Role.VIEWER] as Role[]).includes(targetRole);
    }

    // MANAGER can manage VIEWER
    if (authUser.role === Role.MANAGER) {
      return targetRole === Role.VIEWER;
    }

    return false;
  }

  /**
   * Check if user can create a specific role
   */
  private canCreateRole(authUser: AuthUser, targetRole: Role): boolean {
    switch (authUser.role) {
      case Role.SUPER_ADMIN:
        return true;
      case Role.ADMIN:
        return ([Role.MANAGER, Role.VIEWER] as Role[]).includes(targetRole);
      case Role.MANAGER:
        return targetRole === Role.VIEWER;
      default:
        return false;
    }
  }

  /**
   * Get the active company ID from request header or return all company IDs
   */
  private getActiveCompanyId(
    authUser: AuthUser,
    headerCompanyId?: string
  ): string | null {
    // SUPER_ADMIN sees all companies by default
    if (authUser.role === Role.SUPER_ADMIN) {
      return headerCompanyId || null;
    }

    // For other roles, use header company ID if provided and user has access
    if (headerCompanyId && authUser.companyIds.includes(headerCompanyId)) {
      return headerCompanyId;
    }

    // Return first company ID as default
    return authUser.companyIds[0] || null;
  }

  /**
   * Create a new user
   */
  async createUser(
    data: CreateUserInput,
    authUser: AuthUser
  ): Promise<UserResponse> {
    // Check if authenticated user can create this role
    if (!this.canCreateRole(authUser, data.role)) {
      throw new ForbiddenError(
        `You do not have permission to create ${data.role} users`
      );
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    // Handle company assignment
    let companyIds = data.companyIds || [];

    // If no companies specified and user is not SUPER_ADMIN, assign to user's companies
    if (companyIds.length === 0 && authUser.role !== Role.SUPER_ADMIN) {
      companyIds = authUser.companyIds;
    }

    // Validate company IDs exist
    if (companyIds.length > 0) {
      const companies = await this.prisma.company.findMany({
        where: {
          id: { in: companyIds },
          deleted: false,
        },
      });

      if (companies.length !== companyIds.length) {
        throw new ValidationError("One or more company IDs are invalid");
      }
    }

    // Handle device assignment
    let deviceIds = data.deviceIds || [];

    // Validate device requirement for VIEWER role
    if (data.role === Role.VIEWER && deviceIds.length === 0) {
      throw new ValidationError("VIEWER users must have at least one device assigned");
    }

    // Validate device IDs exist and user has access to them
    if (deviceIds.length > 0) {
      const devices = await this.prisma.device.findMany({
        where: {
          id: { in: deviceIds },
          deleted: false,
        },
        select: {
          id: true,
          companyId: true,
        },
      });

      if (devices.length !== deviceIds.length) {
        throw new ValidationError("One or more device IDs are invalid");
      }

      // Check if user has access to device companies
      // SUPER_ADMIN can assign any device
      if (authUser.role !== Role.SUPER_ADMIN) {
        // For other roles, devices must be in companies the user has access to
        const deviceCompanyIds = devices.map((d) => d.companyId);
        const hasAccess = deviceCompanyIds.every((companyId) =>
          authUser.companyIds.includes(companyId)
        );

        if (!hasAccess) {
          throw new ForbiddenError(
            "You can only assign devices from companies you have access to"
          );
        }
      }

      // If creating a user with companies, validate devices belong to those companies
      if (companyIds.length > 0) {
        const deviceCompanyIds = devices.map((d) => d.companyId);
        const allDevicesInUserCompanies = deviceCompanyIds.every((companyId) =>
          companyIds.includes(companyId)
        );

        if (!allDevicesInUserCompanies) {
          throw new ValidationError(
            "All assigned devices must belong to the user's assigned companies"
          );
        }
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user with company and device relations
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        phoneNumber: data.phoneNumber,
        role: data.role,
        position: data.position,
        primaryCompanyId: companyIds.length === 1 ? companyIds[0] : null,
        companies: {
          create: companyIds.map((companyId) => ({
            company: { connect: { id: companyId } },
          })),
        },
        devices: {
          create: deviceIds.map((deviceId) => ({
            device: { connect: { id: deviceId } },
          })),
        },
      },
      include: {
        companies: {
          include: {
            company: {
              select: { id: true, name: true },
            },
          },
        },
        devices: {
          include: {
            device: {
              select: { id: true, name: true, serialNumber: true },
            },
          },
        },
      },
    });

    return this.formatUserResponse(user);
  }

  /**
   * Get users with pagination and filters
   */
  async getUsers(
    query: GetUsersQuery,
    authUser: AuthUser,
    headerCompanyId?: string
  ): Promise<PaginatedUsersResponse> {
    const { page, limit, role, status, search, companyId } = query;
    const skip = (page - 1) * limit;

    // Build where clause based on role and permissions
    const where: any = { deleted: false };

    // Role-based filtering
    if (authUser.role === Role.SUPER_ADMIN) {
      // SUPER_ADMIN sees all users, optionally filtered by company
      if (companyId || headerCompanyId) {
        where.companies = {
          some: {
            companyId: companyId || headerCompanyId,
          },
        };
      }
    } else {
      // Other roles only see users in their companies
      const activeCompanyId = this.getActiveCompanyId(
        authUser,
        headerCompanyId
      );

      if (activeCompanyId) {
        where.companies = {
          some: { companyId: activeCompanyId },
        };
      } else {
        // If no company access, return empty
        return {
          users: [],
          pagination: { total: 0, page, limit, totalPages: 0 },
        };
      }

      // VIEWER can only see own profile
      if (authUser.role === Role.VIEWER) {
        where.id = authUser.id;
      }
    }

    // Apply filters
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await this.prisma.user.count({ where });

    // Get users
    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        companies: {
          include: {
            company: {
              select: { id: true, name: true },
            },
          },
        },
        devices: {
          include: {
            device: {
              select: { id: true, name: true, serialNumber: true },
            },
          },
        },
      },
    });

    return {
      users: users.map(this.formatUserResponse),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string, authUser: AuthUser): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id, deleted: false },
      include: {
        companies: {
          include: {
            company: {
              select: { id: true, name: true },
            },
          },
        },
        devices: {
          include: {
            device: {
              select: { id: true, name: true, serialNumber: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Permission check
    if (authUser.role === Role.VIEWER && user.id !== authUser.id) {
      throw new ForbiddenError("You can only view your own profile");
    }

    // Check if user is in same company (except SUPER_ADMIN)
    if (authUser.role !== Role.SUPER_ADMIN) {
      const userCompanyIds = user.companies.map((uc) => uc.companyId);
      const hasCommonCompany = userCompanyIds.some((cid) =>
        authUser.companyIds.includes(cid)
      );

      if (!hasCommonCompany && user.id !== authUser.id) {
        throw new ForbiddenError("You can only view users in your company");
      }
    }

    return this.formatUserResponse(user);
  }

  /**
   * Update user
   */
  async updateUser(
    id: string,
    data: UpdateUserInput,
    authUser: AuthUser
  ): Promise<UserResponse> {
    // Get existing user
    const existingUser = await this.prisma.user.findUnique({
      where: { id, deleted: false },
      include: {
        companies: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundError("User not found");
    }

    // Check if user can manage this role
    if (!this.canManageUser(authUser, existingUser.role)) {
      throw new ForbiddenError(
        `You do not have permission to update ${existingUser.role} users`
      );
    }

    // If changing role, check if user can create the new role
    if (data.role && !this.canManageUser(authUser, data.role)) {
      throw new ForbiddenError(
        `You do not have permission to assign ${data.role} role`
      );
    }

    // Check email uniqueness if email is being changed
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailExists) {
        throw new ConflictError("User with this email already exists");
      }
    }

    // Hash password if provided
    const updateData: any = {
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      role: data.role,
      status: data.status,
      position: data.position,
    };

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    // Handle company updates
    if (data.companyIds !== undefined) {
      // Validate company IDs
      if (data.companyIds.length > 0) {
        const companies = await this.prisma.company.findMany({
          where: {
            id: { in: data.companyIds },
            deleted: false,
          },
        });

        if (companies.length !== data.companyIds.length) {
          throw new ValidationError("One or more company IDs are invalid");
        }
      }

      // Update companies
      await this.prisma.userCompany.deleteMany({
        where: { userId: id },
      });

      if (data.companyIds.length > 0) {
        await this.prisma.userCompany.createMany({
          data: data.companyIds.map((companyId) => ({
            userId: id,
            companyId,
          })),
        });

        // Set primary company if only one company
        if (data.companyIds.length === 1) {
          updateData.primaryCompanyId = data.companyIds[0];
        }
      } else {
        updateData.primaryCompanyId = null;
      }
    }

    // Handle device updates
    if (data.deviceIds !== undefined) {
      // Determine the final role (either updated or existing)
      const finalRole = data.role || existingUser.role;

      // Validate device requirement for VIEWER role
      if (finalRole === Role.VIEWER && data.deviceIds.length === 0) {
        throw new ValidationError("VIEWER users must have at least one device assigned");
      }

      // Validate device IDs exist and user has access to them
      if (data.deviceIds.length > 0) {
        const devices = await this.prisma.device.findMany({
          where: {
            id: { in: data.deviceIds },
            deleted: false,
          },
          select: {
            id: true,
            companyId: true,
          },
        });

        if (devices.length !== data.deviceIds.length) {
          throw new ValidationError("One or more device IDs are invalid");
        }

        // Check if user has access to device companies
        // SUPER_ADMIN can assign any device
        if (authUser.role !== Role.SUPER_ADMIN) {
          // For other roles, devices must be in companies the user has access to
          const deviceCompanyIds = devices.map((d) => d.companyId);
          const hasAccess = deviceCompanyIds.every((companyId) =>
            authUser.companyIds.includes(companyId)
          );

          if (!hasAccess) {
            throw new ForbiddenError(
              "You can only assign devices from companies you have access to"
            );
          }
        }

        // Get user's company IDs (either updated or existing)
        const userCompanyIds = data.companyIds !== undefined 
          ? data.companyIds 
          : existingUser.companies.map((uc) => uc.companyId);

        // If user has companies, validate devices belong to those companies
        if (userCompanyIds.length > 0) {
          const deviceCompanyIds = devices.map((d) => d.companyId);
          const allDevicesInUserCompanies = deviceCompanyIds.every((companyId) =>
            userCompanyIds.includes(companyId)
          );

          if (!allDevicesInUserCompanies) {
            throw new ValidationError(
              "All assigned devices must belong to the user's assigned companies"
            );
          }
        }
      }

      // Update devices
      await this.prisma.userDevice.deleteMany({
        where: { userId: id },
      });

      if (data.deviceIds.length > 0) {
        await this.prisma.userDevice.createMany({
          data: data.deviceIds.map((deviceId) => ({
            userId: id,
            deviceId,
          })),
        });
      }
    }

    // Update user
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        companies: {
          include: {
            company: {
              select: { id: true, name: true },
            },
          },
        },
        devices: {
          include: {
            device: {
              select: { id: true, name: true, serialNumber: true },
            },
          },
        },
      },
    });

    // If user status changed to SUSPENDED, revoke all active sessions
    if (
      data.status === "SUSPENDED" &&
      existingUser.status !== "SUSPENDED"
    ) {
      await this.prisma.session.deleteMany({
        where: { userId: id },
      });
    }

    return this.formatUserResponse(user);
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(id: string, authUser: AuthUser): Promise<void> {
    // Get existing user
    const existingUser = await this.prisma.user.findUnique({
      where: { id, deleted: false },
    });

    if (!existingUser) {
      throw new NotFoundError("User not found");
    }

    // Check if user can manage this role
    if (!this.canManageUser(authUser, existingUser.role)) {
      throw new ForbiddenError(
        `You do not have permission to delete ${existingUser.role} users`
      );
    }

    // Prevent self-deletion
    if (existingUser.id === authUser.id) {
      throw new ForbiddenError("You cannot delete your own account");
    }

    // Soft delete
    await this.prisma.user.update({
      where: { id },
      data: { deleted: true },
    });
  }

  /**
   * Format user response
   */
  private formatUserResponse(user: any): UserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      status: user.status,
      position: user.position,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      companies: user.companies?.map((uc: any) => ({
        id: uc.company.id,
        name: uc.company.name,
      })),
      devices: user.devices?.map((ud: any) => ({
        id: ud.device.id,
        name: ud.device.name,
        serialNumber: ud.device.serialNumber,
      })),
    };
  }
}
