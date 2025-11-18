// src/routes/company.routes.ts
import { Router } from "express";
import { CompanyController } from "../controllers/company.controller";
import { CompanyService } from "../services/company.service";
import { prisma } from "../config/db";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { Role } from "../types/user.types";

const companyService = new CompanyService(prisma);
const companyController = new CompanyController(companyService);

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/companies
 * @desc    Create a new company
 * @access  ADMIN, SUPER_ADMIN
 * @note    ADMIN will be automatically assigned to created company
 */
router.post(
  "/",
  authorize([Role.ADMIN, Role.SUPER_ADMIN]),
  companyController.createCompany
);

/**
 * @route   GET /api/companies
 * @desc    Get all companies with pagination and filters
 * @access  ADMIN (sees assigned companies), SUPER_ADMIN (sees all)
 * @query   page, limit, search, status
 */
router.get(
  "/",
  authorize([Role.ADMIN, Role.SUPER_ADMIN]),
  companyController.getCompanies
);

/**
 * @route   GET /api/companies/:id
 * @desc    Get company by ID
 * @access  ADMIN (only assigned companies), SUPER_ADMIN (any company)
 */
router.get(
  "/:id",
  authorize([Role.ADMIN, Role.SUPER_ADMIN]),
  companyController.getCompanyById
);

/**
 * @route   PUT /api/companies/:id
 * @desc    Update company
 * @access  ADMIN (only assigned companies), SUPER_ADMIN (any company)
 */
router.put(
  "/:id",
  authorize([Role.ADMIN, Role.SUPER_ADMIN]),
  companyController.updateCompany
);

/**
 * @route   DELETE /api/companies/:id
 * @desc    Delete company (soft delete)
 * @access  ADMIN (only assigned companies), SUPER_ADMIN (any company)
 * @note    Cannot delete company with devices or users
 */
router.delete(
  "/:id",
  authorize([Role.ADMIN, Role.SUPER_ADMIN]),
  companyController.deleteCompany
);

export default router;
