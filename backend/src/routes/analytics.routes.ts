// src/routes/analytics.routes.ts
import { Router } from "express";
import { AnalyticsController } from "../controllers/analytics.controller";
import { AnalyticsService } from "../services/analytics.service";
import { PrismaClient } from "../generated/prisma/client";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { Role } from "../types/user.types";

const router = Router();
const prisma = new PrismaClient();
const analyticsService = new AnalyticsService(prisma);
const analyticsController = new AnalyticsController(analyticsService);

/**
 * @route   GET /api/analytics/counts
 * @desc    Get analytics counts (users, devices, companies)
 * @access  Private (SUPER_ADMIN, ADMIN, MANAGER)
 * @query   role - Filter by user role
 * @query   status - Filter by user status
 * @query   companyId - Filter by company (Super Admin only)
 */
router.get(
  "/counts",
  authenticate,
  authorize([Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER]),
  analyticsController.getCounts
);

export default router;
