// src/utils/jwt.utils.ts
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { JWTPayload, DecodedToken } from "../types/auth.types";
import { UnauthorizedError } from "./errors";

// Token expiry times
export const TOKEN_EXPIRY = {
  ACCESS: "15m", // 15 minutes
  REFRESH: "7d", // 7 days
};

/**
 * Generate access token
 */
export function generateAccessToken(payload: Omit<JWTPayload, "type">): string {
  return jwt.sign(
    {
      ...payload,
      type: "access",
    },
    ENV.JWT_SECRET,
    {
      expiresIn: TOKEN_EXPIRY.ACCESS,
      issuer: ENV.JWT_ISSUER,
      audience: ENV.JWT_AUDIENCE,
    } as jwt.SignOptions
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(
  payload: Omit<JWTPayload, "type">
): string {
  return jwt.sign(
    {
      ...payload,
      type: "refresh",
    },
    ENV.JWT_REFRESH_SECRET,
    {
      expiresIn: TOKEN_EXPIRY.REFRESH,
      issuer: ENV.JWT_ISSUER,
      audience: ENV.JWT_AUDIENCE,
    } as jwt.SignOptions
  );
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(payload: Omit<JWTPayload, "type">) {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    expiresIn: 900, // 15 minutes in seconds
  };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): DecodedToken {
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET, {
      issuer: ENV.JWT_ISSUER,
      audience: ENV.JWT_AUDIENCE,
    }) as DecodedToken;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("Access token has expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError("Invalid access token");
    } else {
      throw new UnauthorizedError("Token verification failed");
    }
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): DecodedToken {
  try {
    const decoded = jwt.verify(token, ENV.JWT_REFRESH_SECRET, {
      issuer: ENV.JWT_ISSUER,
      audience: ENV.JWT_AUDIENCE,
    }) as DecodedToken;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("Refresh token has expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError("Invalid refresh token");
    } else {
      throw new UnauthorizedError("Token verification failed");
    }
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): any {
  return jwt.decode(token);
}

/**
 * Get token expiry time in seconds
 */
export function getTokenExpiry(expiryString: string): number {
  const unit = expiryString.slice(-1);
  const value = parseInt(expiryString.slice(0, -1));

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 3600;
    case "d":
      return value * 86400;
    default:
      return 900; // default 15 minutes
  }
}
