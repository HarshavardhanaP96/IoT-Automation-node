// src/services/analytics.service.ts
import { PrismaClient, Role, UserStatus } from "../generated/prisma/client";
import { AuthUser } from "../types/user.types";
import { ForbiddenError } from "../utils/errors";

export interface AnalyticsFilters {
  role?: Role;
  status?: UserStatus;
  companyId?: string;
}

export interface AnalyticsCounts {
  users: number;
  devices: number;
  companies?: number; // Only for Super Admin
}

export class AnalyticsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get analytics counts based on user role and filters
   */
  async getCounts(
    authUser: AuthUser,
    filters: AnalyticsFilters
  ): Promise<AnalyticsCounts> {
    const isSuperAdmin = authUser.role === "SUPER_ADMIN";

    // Determine the company scope
    let companyScope: string | undefined;
    
    if (!isSuperAdmin) {
      // For Admin and Manager, use the filter's companyId or their primary company
      companyScope = filters.companyId || authUser.primaryCompanyId;
      
      if (!companyScope) {
        throw new ForbiddenError("No active company selected");
      }
      
      // Verify the user has access to this company
      if (!authUser.companyIds.includes(companyScope)) {
        throw new ForbiddenError("You do not have access to this company");
      }
    } else if (filters.companyId) {
      // Super Admin can filter by specific company
      companyScope = filters.companyId;
    }

    // Build user count query
    const userCountWhere: any = {
      deleted: false,
    };

    if (filters.role) {
      userCountWhere.role = filters.role;
    }

    if (filters.status) {
      userCountWhere.status = filters.status;
    }

    if (companyScope) {
      userCountWhere.companies = {
        some: {
          companyId: companyScope,
        },
      };
    }

    // Build device count query
    const deviceCountWhere: any = {};

    if (companyScope) {
      deviceCountWhere.companyId = companyScope;
    }

    // Execute counts in parallel
    const [userCount, deviceCount, companyCount] = await Promise.all([
      this.prisma.user.count({ where: userCountWhere }),
      this.prisma.device.count({ where: deviceCountWhere }),
      // Only count companies for Super Admin
      isSuperAdmin
        ? this.prisma.company.count({ where: { deleted: false } })
        : Promise.resolve(undefined),
    ]);

    const result: AnalyticsCounts = {
      users: userCount,
      devices: deviceCount,
    };

    if (isSuperAdmin) {
      result.companies = companyCount;
    }

    return result;
  }
}
