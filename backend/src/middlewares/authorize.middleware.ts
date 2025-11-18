// src/middlewares/authorize.middleware.ts
import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../utils/errors";
import { Role } from "../types/user.types";

/**
 * Authorization middleware
 * Checks if user has required role
 */
export const authorize = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new ForbiddenError("User not authenticated");
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError(
          "You do not have permission to perform this action"
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
