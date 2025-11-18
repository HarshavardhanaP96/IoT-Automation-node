// src/services/company.service.ts
import { PrismaClient, Role } from "../generated/prisma";
import {
  CreateCompanyInput,
  UpdateCompanyInput,
  GetCompaniesQuery,
  CompanyResponse,
  PaginatedCompaniesResponse,
} from "../types/company.types";
import { AuthUser } from "../types/user.types";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from "../utils/errors";

export class CompanyService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Check if user can manage a specific company
   */
  private async canManageCompany(
    authUser: AuthUser,
    companyId: string
  ): Promise<boolean> {
    // SUPER_ADMIN can manage any company
    if (authUser.role === Role.SUPER_ADMIN) {
      return true;
    }

    // ADMIN can manage companies they're assigned to
    if (authUser.role === Role.ADMIN) {
      return authUser.companyIds.includes(companyId);
    }

    return false;
  }

  /**
   * Create a new company
   */
  async createCompany(
    data: CreateCompanyInput,
    authUser: AuthUser
  ): Promise<CompanyResponse> {
    // Only ADMIN and SUPER_ADMIN can create companies
    if (!([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(authUser.role)) {
      throw new ForbiddenError(
        "Only ADMIN and SUPER_ADMIN can create companies"
      );
    }

    // Check if company name already exists
    const existingCompany = await this.prisma.company.findFirst({
      where: {
        name: data.name,
        deleted: false,
      },
    });

    if (existingCompany) {
      throw new ConflictError("Company with this name already exists");
    }

    // Create company
    const company = await this.prisma.company.create({
      data: {
        name: data.name,
        address: data.address,
        pinCode: data.pinCode,
        status: data.status,
      },
    });

    // If ADMIN creates company, automatically assign them to it
    if (authUser.role === Role.ADMIN) {
      await this.prisma.userCompany.create({
        data: {
          userId: authUser.id,
          companyId: company.id,
        },
      });

      // If this is the user's first company, set it as primary
      const user = await this.prisma.user.findUnique({
        where: { id: authUser.id },
        include: { companies: true },
      });

      if (user && user.companies.length === 1) {
        await this.prisma.user.update({
          where: { id: authUser.id },
          data: { primaryCompanyId: company.id },
        });
      }
    }

    return this.formatCompanyResponse(company);
  }

  /**
   * Get companies with pagination and filters
   */
  async getCompanies(
    query: GetCompaniesQuery,
    authUser: AuthUser
  ): Promise<PaginatedCompaniesResponse> {
    const { page, limit, search, status } = query;
    const skip = (page - 1) * limit;

    // Build where clause based on role
    const where: any = { deleted: false };

    // Role-based filtering
    if (authUser.role === Role.SUPER_ADMIN) {
      // SUPER_ADMIN sees all companies
    } else if (authUser.role === Role.ADMIN) {
      // ADMIN sees only companies assigned to them
      where.users = {
        some: {
          userId: authUser.id,
        },
      };
    } else {
      // MANAGER and VIEWER cannot list companies
      throw new ForbiddenError("You do not have permission to list companies");
    }

    // Apply filters
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await this.prisma.company.count({ where });

    // Get companies with counts
    const companies = await this.prisma.company.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            users: true,
            devices: true,
          },
        },
      },
    });

    return {
      companies: companies.map((company) =>
        this.formatCompanyResponse(company)
      ),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get company by ID
   */
  async getCompanyById(
    id: string,
    authUser: AuthUser
  ): Promise<CompanyResponse> {
    const company = await this.prisma.company.findUnique({
      where: { id, deleted: false },
      include: {
        _count: {
          select: {
            users: true,
            devices: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundError("Company not found");
    }

    // Permission check
    if (authUser.role !== Role.SUPER_ADMIN) {
      if (authUser.role === Role.ADMIN) {
        if (!authUser.companyIds.includes(id)) {
          throw new ForbiddenError(
            "You can only view companies assigned to you"
          );
        }
      } else {
        throw new ForbiddenError(
          "You do not have permission to view companies"
        );
      }
    }

    return this.formatCompanyResponse(company);
  }

  /**
   * Update company
   */
  async updateCompany(
    id: string,
    data: UpdateCompanyInput,
    authUser: AuthUser
  ): Promise<CompanyResponse> {
    // Get existing company
    const existingCompany = await this.prisma.company.findUnique({
      where: { id, deleted: false },
    });

    if (!existingCompany) {
      throw new NotFoundError("Company not found");
    }

    // Permission check
    const canManage = await this.canManageCompany(authUser, id);
    if (!canManage) {
      throw new ForbiddenError(
        "You do not have permission to update this company"
      );
    }

    // Check name uniqueness if name is being changed
    if (data.name && data.name !== existingCompany.name) {
      const nameExists = await this.prisma.company.findFirst({
        where: {
          name: data.name,
          deleted: false,
          id: { not: id },
        },
      });

      if (nameExists) {
        throw new ConflictError("Company with this name already exists");
      }
    }

    // Update company
    const company = await this.prisma.company.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        pinCode: data.pinCode,
        status: data.status,
      },
      include: {
        _count: {
          select: {
            users: true,
            devices: true,
          },
        },
      },
    });

    return this.formatCompanyResponse(company);
  }

  /**
   * Delete company (soft delete)
   */
  async deleteCompany(id: string, authUser: AuthUser): Promise<void> {
    // Get existing company
    const existingCompany = await this.prisma.company.findUnique({
      where: { id, deleted: false },
      include: {
        _count: {
          select: {
            devices: true,
            users: true,
          },
        },
      },
    });

    if (!existingCompany) {
      throw new NotFoundError("Company not found");
    }

    // Permission check
    const canManage = await this.canManageCompany(authUser, id);
    if (!canManage) {
      throw new ForbiddenError(
        "You do not have permission to delete this company"
      );
    }

    // Check if company has devices
    if (existingCompany._count.devices > 0) {
      throw new ValidationError(
        `Cannot delete company with ${existingCompany._count.devices} devices. Please delete or reassign devices first.`
      );
    }

    // Check if company has users (other than the deleting user)
    if (
      existingCompany._count.users > 1 ||
      (existingCompany._count.users === 1 && authUser.role !== Role.ADMIN)
    ) {
      throw new ValidationError(
        `Cannot delete company with ${existingCompany._count.users} users. Please reassign users first.`
      );
    }

    // Soft delete
    await this.prisma.company.update({
      where: { id },
      data: { deleted: true },
    });
  }

  /**
   * Format company response
   */
  private formatCompanyResponse(company: any): CompanyResponse {
    return {
      id: company.id,
      name: company.name,
      address: company.address,
      pinCode: company.pinCode,
      status: company.status,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      userCount: company._count?.users,
      deviceCount: company._count?.devices,
    };
  }
}
