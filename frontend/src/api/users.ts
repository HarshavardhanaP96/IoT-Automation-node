// src/api/users.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { api } from "./client";
import type { User, CreateUserInput, UpdateUserInput } from "../types/user";
import type { Role, UserStatus } from "../types/enums";

interface UseUsersParams {
  page: number;
  limit?: number;
  search?: string;
  role?: Role;
  status?: UserStatus;
  companyId?: string;
}

interface UsersResponse {
  success: boolean;
  data: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UserResponse {
  success: boolean;
  data: User;
  message?: string;
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

// Fetch paginated users with filters
export const useUsers = ({
  page,
  limit = 10,
  search = "",
  role,
  status,
  companyId,
}: UseUsersParams) => {
  const queryKey = ["users", { page, limit, search, role, status, companyId }];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<UsersResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append("search", search);
      if (role) params.append("role", role);
      if (status) params.append("status", status);
      if (companyId) params.append("companyId", companyId);

      const { data } = await api.get<UsersResponse>(
        `/users?${params.toString()}`
      );
      return data;
    },
    staleTime: 5000,
    placeholderData: keepPreviousData,
  });
};

// Fetch single user by ID
export const useUser = (id: string) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: async (): Promise<User> => {
      const { data } = await api.get<UserResponse>(`/users/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

// Create new user
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: CreateUserInput) => {
      const { data } = await api.post<UserResponse>("/users", userData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      console.error("Create user error:", error.response?.data || error);
      throw error;
    },
  });
};

// Update existing user
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...userData
    }: UpdateUserInput & { id: string }) => {
      const { data } = await api.put<UserResponse>(`/users/${id}`, userData);
      return data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
      queryClient.setQueryData(["user", variables.id], data);
    },
    onError: (error: any) => {
      console.error("Update user error:", error.response?.data || error);
      throw error;
    },
  });
};

// Delete user
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.delete<DeleteResponse>(`/users/${userId}`);
      return data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
    onError: (error: any) => {
      console.error("Delete user error:", error.response?.data || error);
      throw error;
    },
  });
};
