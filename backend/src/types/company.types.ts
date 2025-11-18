// src/types/company.types.ts
import { z } from "zod";

// Zod Schemas
export const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(255),
  address: z.string().optional(),
  pinCode: z.string().optional(),
  status: z.string().optional(),
});

export const updateCompanySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  address: z.string().nullable().optional(),
  pinCode: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
});

export const getCompaniesQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10"),
  search: z.string().optional(),
  status: z.string().optional(),
});

export const companyIdParamSchema = z.object({
  id: z.string().uuid("Invalid company ID format"),
});

// Types
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type GetCompaniesQuery = z.infer<typeof getCompaniesQuerySchema>;
export type CompanyIdParam = z.infer<typeof companyIdParamSchema>;

export interface CompanyResponse {
  id: string;
  name: string;
  address: string | null;
  pinCode: string | null;
  status: string | null;
  createdAt: Date;
  updatedAt: Date;
  userCount?: number; // Optional: number of users in this company
  deviceCount?: number; // Optional: number of devices in this company
}

export interface PaginatedCompaniesResponse {
  companies: CompanyResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
