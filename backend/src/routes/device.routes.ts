// src/routes/device.routes.ts
import { Router } from "express";
import { DeviceController } from "../controllers/device.controller";
import { DeviceService } from "../services/device.service";
import { prisma } from "../config/db";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { activeCompanyMiddleware } from "../middlewares/activeCompany.middleware";
import { Role } from "../types/user.types";

const deviceService = new DeviceService(prisma);
const deviceController = new DeviceController(deviceService);

const router = Router();

// All routes require authentication
router.use(authenticate);

// Apply active company middleware to extract company from header
router.use(activeCompanyMiddleware);

/**
 * @route   POST /api/devices
 * @desc    Create a new device
 * @access  ADMIN (in active company), SUPER_ADMIN (any company)
 * @header  X-Active-Company: Company ID (required for ADMIN)
 * @body    { companyId, name, serialNumber, type, ... }
 * @note    ADMIN can only create devices in active company from header
 */
router.post(
  "/",
  authorize([Role.ADMIN, Role.SUPER_ADMIN]),
  deviceController.createDevice
);

/**
 * @route   GET /api/devices
 * @desc    Get all devices with pagination and filters
 * @access  All authenticated users (filtered by role)
 * @header  X-Active-Company: Company ID (filters for ADMIN/MANAGER)
 * @query   page, limit, search, type, companyId, parentId, includeChildren
 * @note    VIEWER sees only assigned devices
 */
router.get("/", deviceController.getDevices);

/**
 * @route   GET /api/devices/:id
 * @desc    Get device by ID
 * @access  All authenticated users (based on permissions)
 * @note    VIEWER can only view assigned devices
 */
router.get("/:id", deviceController.getDeviceById);

/**
 * @route   PUT /api/devices/:id
 * @desc    Update device
 * @access  ADMIN (in active company), SUPER_ADMIN (any device)
 * @header  X-Active-Company: Company ID (required for ADMIN)
 */
router.put(
  "/:id",
  authorize([Role.ADMIN, Role.SUPER_ADMIN]),
  deviceController.updateDevice
);

/**
 * @route   DELETE /api/devices/:id
 * @desc    Delete device (soft delete)
 * @access  ADMIN (in active company), SUPER_ADMIN (any device)
 * @header  X-Active-Company: Company ID (required for ADMIN)
 * @note    Cannot delete device with children
 */
router.delete(
  "/:id",
  authorize([Role.ADMIN, Role.SUPER_ADMIN]),
  deviceController.deleteDevice
);

export default router;
