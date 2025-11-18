// src/controllers/company.controller.ts
import { Request, Response, NextFunction } from "express";
import { CompanyService } from "../services/company.service";
import {
  createCompanySchema,
  updateCompanySchema,
  getCompaniesQuerySchema,
  companyIdParamSchema,
} from "../types/company.types";
import { ValidationError } from "../utils/errors";

export class CompanyController {
  constructor(private companyService: CompanyService) {}

  createCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedData = createCompanySchema.parse(req.body);
      const authUser = req.user!;

      const company = await this.companyService.createCompany(
        validatedData,
        authUser
      );

      res.status(201).json({
        success: true,
        data: company,
        message: "Company created successfully",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        next(new ValidationError("Validation failed", error));
      } else {
        next(error);
      }
    }
  };

  getCompanies = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedQuery = getCompaniesQuerySchema.parse(req.query);
      const authUser = req.user!;

      const result = await this.companyService.getCompanies(
        validatedQuery,
        authUser
      );

      res.status(200).json({
        success: true,
        data: result.companies,
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

  getCompanyById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = companyIdParamSchema.parse(req.params);
      const authUser = req.user!;

      const company = await this.companyService.getCompanyById(id, authUser);

      res.status(200).json({
        success: true,
        data: company,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        next(new ValidationError("Invalid company ID", error));
      } else {
        next(error);
      }
    }
  };

  updateCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = companyIdParamSchema.parse(req.params);
      const validatedData = updateCompanySchema.parse(req.body);
      const authUser = req.user!;

      const company = await this.companyService.updateCompany(
        id,
        validatedData,
        authUser
      );

      res.status(200).json({
        success: true,
        data: company,
        message: "Company updated successfully",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        next(new ValidationError("Validation failed", error));
      } else {
        next(error);
      }
    }
  };

  deleteCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = companyIdParamSchema.parse(req.params);
      const authUser = req.user!;

      await this.companyService.deleteCompany(id, authUser);

      res.status(200).json({
        success: true,
        message: "Company deleted successfully",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        next(new ValidationError("Invalid company ID", error));
      } else {
        next(error);
      }
    }
  };
}
