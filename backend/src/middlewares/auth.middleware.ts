// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../utils/errors";
import { AuthUser, Role } from "../types/user.types";
import { verifyAccessToken } from "../utils/jwt.utils";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("Authenticating request...");
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError("No authorization header provided");
    }

    // Check Bearer format
    if (!authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError(
        "Invalid authorization header format. Use: Bearer <token>"
      );
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new UnauthorizedError("No token provided");
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role as Role,
      companyIds: decoded.companyIds,
      primaryCompanyId: decoded.primaryCompanyId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if missing
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      if (token) {
        try {
          const decoded = verifyAccessToken(token);
          req.user = {
            id: decoded.id,
            role: decoded.role as Role,
            companyIds: decoded.companyIds,
            email: decoded.email,
          };
        } catch (error) {
          // Token invalid, but we don't throw error for optional auth
          // Just continue without user
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
