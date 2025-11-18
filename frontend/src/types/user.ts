// src/types/user.ts
import { Role, UserStatus } from "./enums";

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: Role;
  status: UserStatus;
  position: string | null;
  createdAt: string;
  updatedAt: string;
  companies?: Company[];
  devices?: Device[];
}

export interface Company {
  id: string;
  name: string;
}

export interface Device {
  id: string;
  name: string;
  serialNumber: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: Role;
  position?: string;
  companyIds?: string[];
  deviceIds?: string[];
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  phoneNumber?: string | null;
  role?: Role;
  status?: UserStatus;
  position?: string | null;
  companyIds?: string[];
  deviceIds?: string[];
}

export interface UserDevice {
  id: string;
  userId: string;
  deviceId: string;
  createdAt: string;
  updatedAt: string;
}
