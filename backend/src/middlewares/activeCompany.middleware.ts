// src/middlewares/activeCompany.middleware.ts
import { Request, Response, NextFunction } from "express";
import { ForbiddenError, ValidationError } from "../utils/errors";
import { AuthUser, Role } from "../types/user.types";

declare global {
  namespace Express {
    interface Request {
      activeCompanyId?: string;
      user?: AuthUser;
    }
  }
}

/**
 * Active Company Middleware (Enhanced with Primary Company Support)
 *
 * Purpose:
 * - Extracts and validates the X-Active-Company header
 * - Ensures users can only access companies they're assigned to
 * - Provides intelligent defaults using primaryCompanyId
 *
 * Behavior by Role:
 * - SUPER_ADMIN: Optional header, can access any company or all companies
 * - ADMIN/MANAGER/VIEWER: Header validated against assigned companies
 *   - If no header: Uses primaryCompanyId if set
 *   - Falls back to first company if no primary is set
 *
 * Security:
 * - Prevents unauthorized company access
 * - Validates UUID format
 * - Requires authentication context
 */
export const activeCompanyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authUser = req.user;

    // --- 1. Authentication Context Check ---
    if (!authUser) {
      return next(
        new ForbiddenError(
          "Authentication context missing. Cannot establish company scope."
        )
      );
    }

    const headerCompanyId = req.headers["x-active-company"] as string;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // --- 2. SUPER_ADMIN Handling ---
    if (authUser.role === Role.SUPER_ADMIN) {
      if (headerCompanyId) {
        // Validate format if provided
        if (!uuidRegex.test(headerCompanyId)) {
          return next(
            new ValidationError("Invalid company ID format in header")
          );
        }
        req.activeCompanyId = headerCompanyId;
      }
      // If no header, req.activeCompanyId remains undefined
      // This allows SUPER_ADMIN to query across all companies
      return next();
    }

    // --- 3. Company-Specific Roles (ADMIN, MANAGER, VIEWER) ---
    let activeCompanyId: string | undefined = undefined;

    if (headerCompanyId) {
      // a. Format Validation
      if (!uuidRegex.test(headerCompanyId)) {
        return next(new ValidationError("Invalid company ID format in header"));
      }

      // b. Security Validation (CRITICAL)
      // Ensure user is assigned to the requested company
      if (!authUser.companyIds.includes(headerCompanyId)) {
        return next(
          new ForbiddenError(
            `Access denied. User is not assigned to company ID: ${headerCompanyId}.`
          )
        );
      }

      activeCompanyId = headerCompanyId;
    }

    // c. Smart Fallback: Primary Company First, Then First Company
    if (!activeCompanyId) {
      // Prefer primaryCompanyId if set
      if (authUser.primaryCompanyId) {
        activeCompanyId = authUser.primaryCompanyId;
      } else {
        // Fallback to first assigned company
        activeCompanyId = authUser.companyIds[0];
      }
    }

    // d. Final Safety Check
    if (!activeCompanyId) {
      return next(
        new ForbiddenError(
          "Active company context required. User is not assigned to any company."
        )
      );
    }

    // --- 4. Attach Validated Company ID ---
    req.activeCompanyId = activeCompanyId;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional Active Company Middleware
 *
 * Use this for endpoints where company context is optional
 * Still validates header if provided and uses smart defaults
 */
export const optionalActiveCompanyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authUser = req.user;

    if (!authUser) {
      return next(
        new ForbiddenError(
          "Authentication context missing. Cannot establish company scope."
        )
      );
    }

    const headerCompanyId = req.headers["x-active-company"] as string;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // SUPER_ADMIN: Accept any company ID
    if (authUser.role === Role.SUPER_ADMIN) {
      if (headerCompanyId) {
        if (!uuidRegex.test(headerCompanyId)) {
          return next(
            new ValidationError("Invalid company ID format in header")
          );
        }
        req.activeCompanyId = headerCompanyId;
      }
      return next();
    }

    // Other roles: Validate if header provided
    if (headerCompanyId) {
      if (!uuidRegex.test(headerCompanyId)) {
        return next(new ValidationError("Invalid company ID format in header"));
      }

      if (!authUser.companyIds.includes(headerCompanyId)) {
        return next(
          new ForbiddenError(
            `Access denied. User is not assigned to company ID: ${headerCompanyId}.`
          )
        );
      }

      req.activeCompanyId = headerCompanyId;
    } else {
      // Optional: Set primary company if available
      if (authUser.primaryCompanyId) {
        req.activeCompanyId = authUser.primaryCompanyId;
      }
    }

    // No error if missing - truly optional
    next();
  } catch (error) {
    next(error);
  }
};
