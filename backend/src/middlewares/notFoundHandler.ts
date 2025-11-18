import { Request, Response } from "express";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource was not found",
    path: req.path,
  });
}
