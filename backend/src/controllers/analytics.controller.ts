// src/controllers/analytics.controller.ts
import { Request, Response, NextFunction } from "express";
import { AnalyticsService } from "../services/analytics.service";
import { Role, UserStatus } from "../generated/prisma/client";

export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  getCounts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authUser = req.user!;
      
      // Parse filters from query params
      const filters: any = {};
      
      if (req.query.role) {
        filters.role = req.query.role as Role;
      }
      
      if (req.query.status) {
        filters.status = req.query.status as UserStatus;
      }
      
      if (req.query.companyId) {
        filters.companyId = req.query.companyId as string;
      }

      const counts = await this.analyticsService.getCounts(authUser, filters);

      res.status(200).json({
        success: true,
        data: counts,
      });
    } catch (error) {
      next(error);
    }
  };
}
