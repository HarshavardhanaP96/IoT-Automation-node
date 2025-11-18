// src/api/devices.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { api } from "./client";
import type { Device, DeviceFormData } from "../types/device";
import { DeviceType } from "../types/device";

interface UseDevicesParams {
  page: number;
  limit?: number;
  search?: string;
  type?: DeviceType;
  companyId?: string;
  parentId?: string;
  includeChildren?: boolean;
}

interface DevicesResponse {
  success: boolean;
  data: Device[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface DeviceResponse {
  success: boolean;
  data: Device;
  message?: string;
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

export interface CreateDeviceInput extends DeviceFormData {
  companyId: string; // Required for device creation
}

export interface UpdateDeviceInput {
  name?: string;
  serialNumber?: string;
  regNumber?: string | null;
  type?: DeviceType;
  maxValue?: number | null;
  minValue?: number | null;
  precision?: number | null;
  location?: string | null;
  manufacturer?: string | null;
  price?: number | null;
  parentId?: string | null;
}

// Fetch paginated devices with filters
export const useDevices = ({
  page,
  limit = 10,
  search = "",
  type,
  companyId,
  parentId,
  includeChildren,
}: UseDevicesParams) => {
  const queryKey = [
    "devices",
    { page, limit, search, type, companyId, parentId, includeChildren },
  ];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<DevicesResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append("search", search);
      if (type) params.append("type", type);
      if (companyId) params.append("companyId", companyId);
      if (parentId !== undefined) params.append("parentId", parentId);
      if (includeChildren) params.append("includeChildren", "true");

      const { data } = await api.get<DevicesResponse>(
        `/devices?${params.toString()}`
      );
      return data;
    },
    staleTime: 5000,
    placeholderData: keepPreviousData,
  });
};

// Fetch single device by ID
export const useDevice = (id: string) => {
  return useQuery({
    queryKey: ["device", id],
    queryFn: async (): Promise<Device> => {
      const { data } = await api.get<DeviceResponse>(`/devices/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

// Create new device
export const useCreateDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deviceData: CreateDeviceInput) => {
      const { data } = await api.post<DeviceResponse>("/devices", deviceData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
    onError: (error: any) => {
      console.error("Create device error:", error.response?.data || error);
      throw error;
    },
  });
};

// Update existing device
export const useUpdateDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...deviceData
    }: UpdateDeviceInput & { id: string }) => {
      const { data } = await api.put<DeviceResponse>(
        `/devices/${id}`,
        deviceData
      );
      return data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["device", variables.id] });
      queryClient.setQueryData(["device", variables.id], data);
    },
    onError: (error: any) => {
      console.error("Update device error:", error.response?.data || error);
      throw error;
    },
  });
};

// Delete device
export const useDeleteDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deviceId: string) => {
      const { data } = await api.delete<DeleteResponse>(`/devices/${deviceId}`);
      return data;
    },
    onSuccess: (_, deviceId) => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["device", deviceId] });
    },
    onError: (error: any) => {
      console.error("Delete device error:", error.response?.data || error);
      throw error;
    },
  });
};
