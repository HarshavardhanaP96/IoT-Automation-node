// src/api/authService.ts

import { api, clearAuth } from "./client"; // Import your configured axios instance

interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    primaryCompanyId: string | null;
    // ... other user fields
  };
}

/**
 * Handles the login API call, stores tokens, and sets initial user data.
 * @param email The user's email (used as username in your form).
 * @param password The user's password.
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<LoginResponseData> => {
  try {
    const response = await api.post<any, { data: { data: LoginResponseData } }>(
      "/auth/login", // Your specific login endpoint path
      { email, password }
    );

    const { accessToken, refreshToken, user } = response.data.data;

    // Save tokens and user data
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));

    // Set primary company as active
    if (user.primaryCompanyId) {
      localStorage.setItem("activeCompanyId", user.primaryCompanyId);
    }

    return response.data.data;
  } catch (error) {
    // Ensure all auth-related storage is cleared on login failure
    clearAuth();

    // Re-throw the error so the calling component can handle it (e.g., set error message)
    throw error;
  }
};

// You can add other auth-related functions here, e.g.,
// export const logoutUser = () => { /* call API logout if needed, then clearAuth() */ };
