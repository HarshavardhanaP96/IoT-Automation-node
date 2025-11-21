// src/api/client.ts
import axios from "axios";

// Create axios instance with base configuration
export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL || "http://3.111.34.144:3000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add active company header if exists
    const activeCompanyId = localStorage.getItem("activeCompanyId");
    if (activeCompanyId) {
      config.headers["X-Active-Company"] = activeCompanyId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          // No refresh token, redirect to login
          window.location.href = "/login";
          return Promise.reject(error);
        }

        const { data } = await axios.post(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"
          }/auth/refresh`,
          { refreshToken }
        );

        // Save new tokens
        localStorage.setItem("accessToken", data.data.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to set active company
export const setActiveCompany = (companyId: string) => {
  localStorage.setItem("activeCompanyId", companyId);
};

// Helper function to get active company
export const getActiveCompany = (): string | null => {
  return localStorage.getItem("activeCompanyId");
};

// Helper function to clear auth data
export const clearAuth = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("activeCompanyId");
};
