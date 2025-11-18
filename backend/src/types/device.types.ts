// src/types/device.types.ts
import { z } from "zod";

export enum DeviceType {
  GATE_WAY = "GATE_WAY",
  SENSOR = "SENSOR",
}

// Zod Schemas
export const createDeviceSchema = z.object({
  name: z.string().min(1, "Device name is required").max(255),
  serialNumber: z.string().min(1, "Serial number is required"),
  regNumber: z.string().optional(),
  type: z.nativeEnum(DeviceType),
  maxValue: z.number().optional(),
  minValue: z.number().optional(),
  precision: z.number().optional(),
  location: z.string().optional(),
  manufacturer: z.string().optional(),
  price: z.number().optional(),
  companyId: z.string().uuid("Invalid company ID"), // Required for device creation
  parentId: z.string().uuid().optional(), // For hierarchical devices
});

export const updateDeviceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  serialNumber: z.string().optional(),
  regNumber: z.string().nullable().optional(),
  type: z.nativeEnum(DeviceType).optional(),
  maxValue: z.number().nullable().optional(),
  minValue: z.number().nullable().optional(),
  precision: z.number().nullable().optional(),
  location: z.string().nullable().optional(),
  manufacturer: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export const getDevicesQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10"),
  search: z.string().optional(),
  type: z.nativeEnum(DeviceType).optional(),
  companyId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  includeChildren: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

export const deviceIdParamSchema = z.object({
  id: z.string().uuid("Invalid device ID format"),
});

// Types
export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;
export type GetDevicesQuery = z.infer<typeof getDevicesQuerySchema>;
export type DeviceIdParam = z.infer<typeof deviceIdParamSchema>;

export interface DeviceResponse {
  id: string;
  name: string;
  serialNumber: string;
  regNumber: string | null;
  type: DeviceType;
  maxValue: number | null;
  minValue: number | null;
  precision: number | null;
  location: string | null;
  manufacturer: string | null;
  price: number | null;
  companyId: string;
  company?: {
    id: string;
    name: string;
  };
  parentId: string | null;
  parent?: {
    id: string;
    name: string;
    serialNumber: string;
  };
  children?: DeviceResponse[]; // For hierarchical structure
  createdAt: Date;
  updatedAt: Date;
  assignedUserCount?: number; // Number of users assigned to this device
}

export interface PaginatedDevicesResponse {
  devices: DeviceResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
