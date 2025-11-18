// src/controllers/device.controller.ts
import { Request, Response, NextFunction } from "express";
import { DeviceService } from "../services/device.service";
import {
  createDeviceSchema,
  updateDeviceSchema,
  getDevicesQuerySchema,
  deviceIdParamSchema,
} from "../types/device.types";
import { ValidationError } from "../utils/errors";

export class DeviceController {
  constructor(private deviceService: DeviceService) {}

  createDevice = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedData = createDeviceSchema.parse(req.body);
      const authUser = req.user!;
      const activeCompanyId = req.activeCompanyId;

      const device = await this.deviceService.createDevice(
        validatedData,
        authUser,
        activeCompanyId
      );

      res.status(201).json({
        success: true,
        data: device,
        message: "Device created successfully",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        next(new ValidationError("Validation failed", error));
      } else {
        next(error);
      }
    }
  };

  getDevices = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedQuery = getDevicesQuerySchema.parse(req.query);
      const authUser = req.user!;
      const activeCompanyId = req.activeCompanyId;

      const result = await this.deviceService.getDevices(
        validatedQuery,
        authUser,
        activeCompanyId
      );

      res.status(200).json({
        success: true,
        data: result.devices,
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

  getDeviceById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = deviceIdParamSchema.parse(req.params);
      const authUser = req.user!;
      const activeCompanyId = req.activeCompanyId;

      const device = await this.deviceService.getDeviceById(
        id,
        authUser,
        activeCompanyId
      );

      res.status(200).json({
        success: true,
        data: device,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        next(new ValidationError("Invalid device ID", error));
      } else {
        next(error);
      }
    }
  };

  updateDevice = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = deviceIdParamSchema.parse(req.params);
      const validatedData = updateDeviceSchema.parse(req.body);
      const authUser = req.user!;
      const activeCompanyId = req.activeCompanyId;

      const device = await this.deviceService.updateDevice(
        id,
        validatedData,
        authUser,
        activeCompanyId
      );

      res.status(200).json({
        success: true,
        data: device,
        message: "Device updated successfully",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        next(new ValidationError("Validation failed", error));
      } else {
        next(error);
      }
    }
  };

  deleteDevice = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = deviceIdParamSchema.parse(req.params);
      const authUser = req.user!;
      const activeCompanyId = req.activeCompanyId;

      await this.deviceService.deleteDevice(id, authUser, activeCompanyId);

      res.status(200).json({
        success: true,
        message: "Device deleted successfully",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        next(new ValidationError("Invalid device ID", error));
      } else {
        next(error);
      }
    }
  };
}
