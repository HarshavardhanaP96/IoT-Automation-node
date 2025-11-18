// src/routes/auth.routes.ts
import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { AuthService } from "../services/auth.service";
import { prisma } from "../config/db";
import { authenticate } from "../middlewares/auth.middleware";

const authService = new AuthService(prisma);
const authController = new AuthController(authService);

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login user with email and password
 * @access  Public
 * @body    { email, password }
 */
router.post("/login", authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 * @body    { refreshToken }
 */
router.post("/refresh", authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout from current device
 * @access  Public
 * @body    { refreshToken }
 */
router.post("/logout", authController.logout);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private (requires authentication)
 */
router.post("/logout-all", authenticate, authController.logoutAll);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private (requires authentication)
 * @body    { currentPassword, newPassword }
 * @note    Invalidates all sessions, user must login again
 */
router.post("/change-password", authenticate, authController.changePassword);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user information
 * @access  Private (requires authentication)
 */
router.get("/me", authenticate, authController.getCurrentUser);

/**
 * @route   GET /api/auth/sessions
 * @desc    Get all active sessions for current user
 * @access  Private (requires authentication)
 */
router.get("/sessions", authenticate, authController.getActiveSessions);

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Revoke a specific session
 * @access  Private (requires authentication)
 */
router.delete(
  "/sessions/:sessionId",
  authenticate,
  authController.revokeSession
);

export default router;
