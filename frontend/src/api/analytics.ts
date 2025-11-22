// src/api/analytics.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "./client";
import { Role, UserStatus } from "../types/enums";

export interface AnalyticsFilters {
  role?: Role;
  status?: UserStatus;
  companyId?: string;
}

export interface AnalyticsCounts {
  users: number;
  devices: number;
  companies?: number;
}

/**
 * Fetch analytics counts with optional filters
 */
export const useAnalyticsCounts = (filters?: AnalyticsFilters) => {
  return useQuery({
    queryKey: ["analytics", "counts", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.role) {
        params.append("role", filters.role);
      }
      
      if (filters?.status) {
        params.append("status", filters.status);
      }
      
      if (filters?.companyId) {
        params.append("companyId", filters.companyId);
      }

      const response = await api.get<{ success: boolean; data: AnalyticsCounts }>(
        `/analytics/counts?${params.toString()}`
      );
      
      return response.data.data;
    },
  });
};
