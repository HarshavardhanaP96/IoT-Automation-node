// src/api/companies.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { api } from "./client";
import type { Company } from "../types/company";

interface UseCompaniesParams {
  page: number;
  limit?: number;
  search?: string;
  status?: string;
}

interface CompaniesResponse {
  success: boolean;
  data: Company[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface CompanyResponse {
  success: boolean;
  data: Company;
  message?: string;
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

export interface CreateCompanyInput {
  name: string;
  address?: string;
  pinCode?: string;
  status?: string;
}

export interface UpdateCompanyInput {
  name?: string;
  address?: string | null;
  pinCode?: string | null;
  status?: string | null;
}

// Fetch paginated companies with filters
export const useCompanies = ({
  page,
  limit = 10,
  search = "",
  status,
}: UseCompaniesParams) => {
  const queryKey = ["companies", { page, limit, search, status }];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<CompaniesResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append("search", search);
      if (status) params.append("status", status);

      const { data } = await api.get<CompaniesResponse>(
        `/companies?${params.toString()}`
      );
      return data;
    },
    staleTime: 5000,
    placeholderData: keepPreviousData,
  });
};

// Fetch single company by ID
export const useCompany = (id: string) => {
  return useQuery({
    queryKey: ["company", id],
    queryFn: async (): Promise<Company> => {
      const { data } = await api.get<CompanyResponse>(`/companies/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

// Create new company
export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (companyData: CreateCompanyInput) => {
      const { data } = await api.post<CompanyResponse>(
        "/companies",
        companyData
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (error: any) => {
      console.error("Create company error:", error.response?.data || error);
      throw error;
    },
  });
};

// Update existing company
export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...companyData
    }: UpdateCompanyInput & { id: string }) => {
      const { data } = await api.put<CompanyResponse>(
        `/companies/${id}`,
        companyData
      );
      return data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["company", variables.id] });
      queryClient.setQueryData(["company", variables.id], data);
    },
    onError: (error: any) => {
      console.error("Update company error:", error.response?.data || error);
      throw error;
    },
  });
};

// Delete company
export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (companyId: string) => {
      const { data } = await api.delete<DeleteResponse>(
        `/companies/${companyId}`
      );
      return data;
    },
    onSuccess: (_, companyId) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
    },
    onError: (error: any) => {
      console.error("Delete company error:", error.response?.data || error);
      throw error;
    },
  });
};
