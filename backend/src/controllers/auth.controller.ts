// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import {
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from "../types/auth.types";
import { ValidationError } from "../utils/errors";

export class AuthController {
  constructor(private authService: AuthService) {}

  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedData = loginSchema.parse(req.body);

      const result = await this.authService.login(validatedData);

      res.status(200).json({
        success: true,
        data: result,
        message: "Login successful",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        next(new ValidationError("Validation failed", error));
      } else {
        next(error);
      }
    }
  };

  refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedData = refreshTokenSchema.parse(req.body);

      const result = await this.authService.refreshToken(validatedData);

      res.status(200).json({
        success: true,
        data: result,
        message: "Token refreshed successfully",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        next(new ValidationError("Validation failed", error));
      } else {
        next(error);
      }
    }
  };

  logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ValidationError("Refresh token is required");
      }

      await this.authService.logout(refreshToken);

      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      next(error);
    }
  };

  logoutAll = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authUser = req.user!;

      await this.authService.logoutAll(authUser.id);

      res.status(200).json({
        success: true,
        message: "Logged out from all devices successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedData = changePasswordSchema.parse(req.body);
      const authUser = req.user!;

      await this.authService.changePassword(validatedData, authUser);

      res.status(200).json({
        success: true,
        message:
          "Password changed successfully. Please login again with your new password.",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        next(new ValidationError("Validation failed", error));
      } else {
        next(error);
      }
    }
  };

  getCurrentUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authUser = req.user!;

      const user = await this.authService.getCurrentUser(authUser);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  getActiveSessions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authUser = req.user!;

      const sessions = await this.authService.getActiveSessions(authUser.id);

      res.status(200).json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  };

  revokeSession = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const authUser = req.user!;

      await this.authService.revokeSession(sessionId, authUser.id);

      res.status(200).json({
        success: true,
        message: "Session revoked successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}
