// src/api/authService.ts

import { api, clearAuth } from "./client";

// 1. 🔑 Updated Interface to match the API response structure
interface LoginResponseData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string; // Added 'role' based on JSON
    status: string; // Added 'status' based on JSON
    companyIds: string[]; // Added 'companyIds' based on JSON
    primaryCompanyId: string | null;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  // The outer API response has 'success' and 'message' as well,
  // but we only care about the inner 'data' block here.
}

/**
 * Handles the login API call, stores tokens, and sets initial user data.
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<LoginResponseData> => {
  try {
    // 2. 🔑 Updated API post type definition for clarity
    const response = await api.post<any, { data: { data: LoginResponseData } }>(
      "/auth/login",
      { email, password }
    );

    // The inner 'data' object holds both 'user' and 'tokens'
    const { tokens, user } = response.data.data; // <-- CORRECT Destructuring

    // Save tokens and user data
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
    // You should save the user object as well, which contains role, company IDs, etc.
    localStorage.setItem("user", JSON.stringify(user));

    // Set primary company as active
    if (user.primaryCompanyId && user.role !== "SUPER_ADMIN") {
      localStorage.setItem("activeCompanyId", user.primaryCompanyId);
    }

    // Return the full data structure if needed by the caller
    return response.data.data;
  } catch (error) {
    clearAuth();
    throw error;
  }
};
