// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import {
  createUserSchema,
  updateUserSchema,
  getUsersQuerySchema,
  userIdParamSchema,
} from "../types/user.types";
import { ValidationError } from "../utils/errors";

export class UserController {
  constructor(private userService: UserService) {}

  createUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedData = createUserSchema.parse(req.body);
      const authUser = req.user!; // Set by auth middleware

      const user = await this.userService.createUser(validatedData, authUser);

      res.status(201).json({
        success: true,
        data: user,
        message: "User created successfully",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        next(new ValidationError("Validation failed", error));
      } else {
        next(error);
      }
    }
  };

  getUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    console.log("Inside getUsers controller");
    try {
      const validatedQuery = getUsersQuerySchema.parse(req.query);
      const authUser = req.user!;
      const activeCompanyId = req.activeCompanyId; // From middleware

      const result = await this.userService.getUsers(
        validatedQuery,
        authUser,
        activeCompanyId
      );

      res.status(200).json({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        next(new ValidationError("Invalid query parameters", error));
      } else {
        next(error);
      }
    }
  };

  getUserById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = userIdParamSchema.parse(req.params);
      const authUser = req.user!;

      const user = await this.userService.getUserById(id, authUser);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        next(new ValidationError("Invalid user ID", error));
      } else {
        next(error);
      }
    }
  };

  updateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = userIdParamSchema.parse(req.params);
      const validatedData = updateUserSchema.parse(req.body);
      const authUser = req.user!;

      const user = await this.userService.updateUser(
        id,
        validatedData,
        authUser
      );

      res.status(200).json({
        success: true,
        data: user,
        message: "User updated successfully",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        next(new ValidationError("Validation failed", error));
      } else {
        next(error);
      }
    }
  };

  deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = userIdParamSchema.parse(req.params);
      const authUser = req.user!;

      await this.userService.deleteUser(id, authUser);

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        next(new ValidationError("Invalid user ID", error));
      } else {
        next(error);
      }
    }
  };
}
