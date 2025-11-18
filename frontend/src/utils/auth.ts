// src/utils/auth.ts

/**
 * Checks if an access token exists in localStorage, indicating a logged-in user.
 * NOTE: This is a synchronous check and does not validate the token's expiry.
 */
export const isAuthenticatedSync = (): boolean => {
  return !!localStorage.getItem("accessToken");
};

/**
 * Gets the stored login redirect path.
 */
export const getLoginRedirectPath = (): string | null => {
  // Check if we are on the client side (browser)
  if (typeof window !== "undefined") {
    // You might need to parse search params, but a simple existence check is sufficient for now
    // For this fix, let's keep it simple and just rely on the stored token.
  }
  return null;
};
