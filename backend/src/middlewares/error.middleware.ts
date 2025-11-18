// src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../utils/errors";
import { ZodError } from "zod";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err instanceof ValidationError &&
        err.details && { details: err.details }),
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      details: err.errors,
    });
    return;
  }

  // Log unexpected errors
  console.error("Unexpected error:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
