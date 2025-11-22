// src/Types/device.ts

import type { UserDevice } from "./user";

export enum DeviceType {
  SENSOR = "SENSOR",
  GATE_WAY = "GATE_WAY",
  // Add other device types as needed
}

type DeviceStatus = "ACTIVE" | "INACTIVE";

export interface Device {
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
  status: DeviceStatus;

  // Self-relation
  parentId: string | null;
  parent?: Device | null;
  children?: Device[];

  users: UserDevice[];

  createdAt: string;
  updatedAt: string;
  deleted: boolean;
}

// For forms and creation
export interface DeviceFormData {
  name: string;
  serialNumber: string;
  regNumber?: string;
  type: DeviceType;
  maxValue?: number;
  minValue?: number;
  precision?: number;
  location?: string;
  manufacturer?: string;
  price?: number;
  parentId?: string | null;
}
