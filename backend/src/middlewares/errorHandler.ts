import { Request, Response, NextFunction } from "express";
import { ENV } from "../config/env";

export default function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Global error handler:", err);

  const isProduction = ENV.NODE_ENV === "production";
  res.status(500).json({
    error: "Internal Server Error",
    message: isProduction ? "An unexpected error occurred" : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
}
