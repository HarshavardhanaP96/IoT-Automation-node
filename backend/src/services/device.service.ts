// src/services/device.service.ts
import { PrismaClient, Role } from "../generated/prisma";
import {
  CreateDeviceInput,
  UpdateDeviceInput,
  GetDevicesQuery,
  DeviceResponse,
  PaginatedDevicesResponse,
} from "../types/device.types";
import { AuthUser } from "../types/user.types";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from "../utils/errors";

export class DeviceService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get active company ID from header or user's primary company
   */
  private getActiveCompanyId(
    authUser: AuthUser,
    headerCompanyId?: string
  ): string {
    if (headerCompanyId) {
      // Validate user has access to this company (except SUPER_ADMIN)
      if (
        authUser.role !== Role.SUPER_ADMIN &&
        !authUser.companyIds.includes(headerCompanyId)
      ) {
        throw new ForbiddenError(
          "You do not have access to the specified company"
        );
      }
      return headerCompanyId;
    }

    // Fallback to primary company
    const primaryCompany = authUser.companyIds[0];
    if (!primaryCompany) {
      throw new ValidationError(
        "No active company specified. Please provide X-Active-Company header."
      );
    }

    return primaryCompany;
  }

  /**
   * Check if user can manage a device in a specific company
   */
  private canManageDeviceInCompany(
    authUser: AuthUser,
    companyId: string
  ): boolean {
    // SUPER_ADMIN can manage devices in any company
    if (authUser.role === Role.SUPER_ADMIN) {
      return true;
    }

    // ADMIN can manage devices in their assigned companies
    if (authUser.role === Role.ADMIN) {
      return authUser.companyIds.includes(companyId);
    }

    // MANAGER and VIEWER cannot manage devices
    return false;
  }

  /**
   * Create a new device
   */
  async createDevice(
    data: CreateDeviceInput,
    authUser: AuthUser,
    headerCompanyId?: string
  ): Promise<DeviceResponse> {
    // Only ADMIN and SUPER_ADMIN can create devices
    if (!([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(authUser.role)) {
      throw new ForbiddenError("Only ADMIN and SUPER_ADMIN can create devices");
    }

    // For ADMIN, ensure device is created in active company from header
    if (authUser.role === Role.ADMIN) {
      const activeCompanyId = this.getActiveCompanyId(
        authUser,
        headerCompanyId
      );

      // Override companyId with active company
      if (data.companyId !== activeCompanyId) {
        throw new ForbiddenError(
          "ADMIN can only create devices in the active company"
        );
      }
    }

    // Validate company exists
    const company = await this.prisma.company.findUnique({
      where: { id: data.companyId, deleted: false },
    });

    if (!company) {
      throw new NotFoundError("Company not found");
    }

    // Check if serial number already exists in this company
    const existingDevice = await this.prisma.device.findFirst({
      where: {
        serialNumber: data.serialNumber,
        companyId: data.companyId,
        deleted: false,
      },
    });

    if (existingDevice) {
      throw new ConflictError(
        "Device with this serial number already exists in this company"
      );
    }

    // Validate parent device if provided
    if (data.parentId) {
      const parentDevice = await this.prisma.device.findUnique({
        where: { id: data.parentId, deleted: false },
      });

      if (!parentDevice) {
        throw new NotFoundError("Parent device not found");
      }

      // Parent device must be in the same company
      if (parentDevice.companyId !== data.companyId) {
        throw new ValidationError("Parent device must be in the same company");
      }
    }

    // Create device
    const device = await this.prisma.device.create({
      data: {
        name: data.name,
        serialNumber: data.serialNumber,
        regNumber: data.regNumber,
        type: data.type,
        maxValue: data.maxValue,
        minValue: data.minValue,
        precision: data.precision,
        location: data.location,
        manufacturer: data.manufacturer,
        price: data.price,
        companyId: data.companyId,
        parentId: data.parentId,
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
        parent: {
          select: { id: true, name: true, serialNumber: true },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    return this.formatDeviceResponse(device);
  }

  /**
   * Get devices with pagination and filters
   */
  async getDevices(
    query: GetDevicesQuery,
    authUser: AuthUser,
    headerCompanyId?: string
  ): Promise<PaginatedDevicesResponse> {
    const { page, limit, search, type, companyId, parentId, includeChildren } =
      query;
    const skip = (page - 1) * limit;

    // Build where clause based on role
    const where: any = { deleted: false };

    // Role-based filtering
    if (authUser.role === Role.SUPER_ADMIN) {
      // SUPER_ADMIN sees all devices, optionally filtered by company
      if (companyId) {
        where.companyId = companyId;
      }
    } else if (authUser.role === Role.ADMIN || authUser.role === Role.MANAGER) {
      // ADMIN and MANAGER see devices in active company
      const activeCompanyId = this.getActiveCompanyId(
        authUser,
        headerCompanyId
      );
      where.companyId = activeCompanyId;
    } else if (authUser.role === Role.VIEWER) {
      // VIEWER sees only devices assigned to them
      where.users = {
        some: {
          userId: authUser.id,
        },
      };
    }

    // Apply filters
    if (type) where.type = type;
    if (parentId) where.parentId = parentId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { serialNumber: { contains: search, mode: "insensitive" } },
        { regNumber: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await this.prisma.device.count({ where });

    // Get devices
    const devices = await this.prisma.device.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        company: {
          select: { id: true, name: true },
        },
        parent: {
          select: { id: true, name: true, serialNumber: true },
        },
        children: includeChildren
          ? {
              where: { deleted: false },
              select: {
                id: true,
                name: true,
                serialNumber: true,
                type: true,
              },
            }
          : false,
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    return {
      devices: devices.map((device) => this.formatDeviceResponse(device)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get device by ID
   */
  async getDeviceById(
    id: string,
    authUser: AuthUser,
    headerCompanyId?: string
  ): Promise<DeviceResponse> {
    const device = await this.prisma.device.findUnique({
      where: { id, deleted: false },
      include: {
        company: {
          select: { id: true, name: true },
        },
        parent: {
          select: { id: true, name: true, serialNumber: true },
        },
        children: {
          where: { deleted: false },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!device) {
      throw new NotFoundError("Device not found");
    }

    // Permission check
    if (authUser.role === Role.SUPER_ADMIN) {
      // SUPER_ADMIN can view any device
    } else if (authUser.role === Role.ADMIN || authUser.role === Role.MANAGER) {
      // ADMIN and MANAGER can view devices in their companies
      if (!authUser.companyIds.includes(device.companyId)) {
        throw new ForbiddenError("You can only view devices in your company");
      }
    } else if (authUser.role === Role.VIEWER) {
      // VIEWER can only view devices assigned to them
      const userDevice = await this.prisma.userDevice.findUnique({
        where: {
          userId_deviceId: {
            userId: authUser.id,
            deviceId: id,
          },
        },
      });

      if (!userDevice) {
        throw new ForbiddenError("You can only view devices assigned to you");
      }
    }

    return this.formatDeviceResponse(device);
  }

  /**
   * Update device
   */
  async updateDevice(
    id: string,
    data: UpdateDeviceInput,
    authUser: AuthUser,
    headerCompanyId?: string
  ): Promise<DeviceResponse> {
    // Only ADMIN and SUPER_ADMIN can update devices
    if (!([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(authUser.role)) {
      throw new ForbiddenError("Only ADMIN and SUPER_ADMIN can update devices");
    }

    // Get existing device
    const existingDevice = await this.prisma.device.findUnique({
      where: { id, deleted: false },
    });

    if (!existingDevice) {
      throw new NotFoundError("Device not found");
    }

    // Permission check
    if (authUser.role === Role.ADMIN) {
      // ADMIN can only update devices in active company
      const activeCompanyId = this.getActiveCompanyId(
        authUser,
        headerCompanyId
      );
      if (existingDevice.companyId !== activeCompanyId) {
        throw new ForbiddenError(
          "You can only update devices in the active company"
        );
      }
    }

    // Check serial number uniqueness if changing
    if (
      data.serialNumber &&
      data.serialNumber !== existingDevice.serialNumber
    ) {
      const serialExists = await this.prisma.device.findFirst({
        where: {
          serialNumber: data.serialNumber,
          companyId: existingDevice.companyId,
          deleted: false,
          id: { not: id },
        },
      });

      if (serialExists) {
        throw new ConflictError(
          "Device with this serial number already exists in this company"
        );
      }
    }

    // Validate parent device if changing
    if (data.parentId !== undefined && data.parentId !== null) {
      const parentDevice = await this.prisma.device.findUnique({
        where: { id: data.parentId, deleted: false },
      });

      if (!parentDevice) {
        throw new NotFoundError("Parent device not found");
      }

      // Prevent circular reference
      if (data.parentId === id) {
        throw new ValidationError("Device cannot be its own parent");
      }

      // Parent must be in same company
      if (parentDevice.companyId !== existingDevice.companyId) {
        throw new ValidationError("Parent device must be in the same company");
      }
    }

    // Update device
    const device = await this.prisma.device.update({
      where: { id },
      data: {
        name: data.name,
        serialNumber: data.serialNumber,
        regNumber: data.regNumber,
        type: data.type,
        maxValue: data.maxValue,
        minValue: data.minValue,
        precision: data.precision,
        location: data.location,
        manufacturer: data.manufacturer,
        price: data.price,
        parentId: data.parentId,
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
        parent: {
          select: { id: true, name: true, serialNumber: true },
        },
        children: {
          where: { deleted: false },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    return this.formatDeviceResponse(device);
  }

  /**
   * Delete device (soft delete)
   */
  async deleteDevice(
    id: string,
    authUser: AuthUser,
    headerCompanyId?: string
  ): Promise<void> {
    // Only ADMIN and SUPER_ADMIN can delete devices
    if (!([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(authUser.role)) {
      throw new ForbiddenError("Only ADMIN and SUPER_ADMIN can delete devices");
    }

    // Get existing device
    const existingDevice = await this.prisma.device.findUnique({
      where: { id, deleted: false },
      include: {
        children: {
          where: { deleted: false },
        },
      },
    });

    if (!existingDevice) {
      throw new NotFoundError("Device not found");
    }

    // Permission check
    if (authUser.role === Role.ADMIN) {
      // ADMIN can only delete devices in active company
      const activeCompanyId = this.getActiveCompanyId(
        authUser,
        headerCompanyId
      );
      if (existingDevice.companyId !== activeCompanyId) {
        throw new ForbiddenError(
          "You can only delete devices in the active company"
        );
      }
    }

    // Check if device has children
    if (existingDevice.children.length > 0) {
      throw new ValidationError(
        `Cannot delete device with ${existingDevice.children.length} child devices. Please delete or reassign child devices first.`
      );
    }

    // Soft delete
    await this.prisma.device.update({
      where: { id },
      data: { deleted: true },
    });
  }

  /**
   * Format device response
   */
  private formatDeviceResponse(device: any): DeviceResponse {
    return {
      id: device.id,
      name: device.name,
      serialNumber: device.serialNumber,
      regNumber: device.regNumber,
      type: device.type,
      maxValue: device.maxValue,
      minValue: device.minValue,
      precision: device.precision,
      location: device.location,
      manufacturer: device.manufacturer,
      price: device.price,
      companyId: device.companyId,
      company: device.company,
      parentId: device.parentId,
      parent: device.parent,
      children: device.children?.map((child: any) => ({
        id: child.id,
        name: child.name,
        serialNumber: child.serialNumber,
        type: child.type,
      })),
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
      assignedUserCount: device._count?.users,
    };
  }
}
