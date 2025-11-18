// src/routes/user.routes.ts
import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { UserService } from "../services/user.service";
import { prisma } from "../config/db";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { activeCompanyMiddleware } from "../middlewares/activeCompany.middleware";
import { Role } from "../types/user.types";

const userService = new UserService(prisma);
const userController = new UserController(userService);

const router = Router();

// All routes require authentication
router.use(authenticate);

// Apply active company middleware to extract company from header
router.use(activeCompanyMiddleware);

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  MANAGER (can create VIEWER), ADMIN (can create MANAGER, VIEWER), SUPER_ADMIN (can create any)
 * @header  X-Active-Company: Company ID (optional for SUPER_ADMIN, required for others)
 */
router.post(
  "/",
  authorize([Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  userController.createUser
);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filters
 * @access  All authenticated users (filtered by role)
 * @query   page, limit, role, status, search, companyId
 * @header  X-Active-Company: Company ID (optional for SUPER_ADMIN, used for filtering)
 */
router.get("/", userController.getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  All authenticated users (based on permissions)
 */
router.get("/:id", userController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (including adding/removing companies)
 * @access  MANAGER (can update VIEWER), ADMIN (can update MANAGER, VIEWER), SUPER_ADMIN (can update any)
 */
router.put(
  "/:id",
  authorize([Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  userController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete)
 * @access  MANAGER (can delete VIEWER), ADMIN (can delete MANAGER, VIEWER), SUPER_ADMIN (can delete any)
 */
router.delete(
  "/:id",
  authorize([Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  userController.deleteUser
);

export default router;
