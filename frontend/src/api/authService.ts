// src/api/authService.ts

import { api, clearAuth } from "./client";
import { store } from "../store/store";
import { login as loginAction } from "../store/slices/authSlice";

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

    // 🔑 Dispatch Redux action to update state immediately
    store.dispatch(
      loginAction({
        userData: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as any,
          status: user.status as any,
          companyIds: user.companyIds,
          primaryCompanyId: user.primaryCompanyId,
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      })
    );

    // Return the full data structure if needed by the caller
    return response.data.data;
  } catch (error) {
    clearAuth();
    throw error;
  }
};
