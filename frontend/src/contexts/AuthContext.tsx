// src/contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { Role, UserStatus } from "../types/enums";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  companyIds: string[];
  primaryCompanyId: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (
    userData: AuthUser,
    tokens: { accessToken: string; refreshToken: string }
  ) => void;
  logout: () => void;
  hasRole: (roles: Role | Role[]) => boolean;
  canCreateUser: (targetRole: Role) => boolean;
  canUpdateUser: (targetRole: Role) => boolean;
  canDeleteUser: (targetRole: Role) => boolean;
  activeCompanyId: string | null;
  setActiveCompanyId: (companyId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeCompanyId, setActiveCompanyIdState] = useState<string | null>(
    null
  );

  useEffect(() => {
    // Load user from localStorage on mount
    const storedUser = localStorage.getItem("user");
    const storedCompanyId = localStorage.getItem("activeCompanyId");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user:", e);
      }
    }

    if (storedCompanyId) {
      setActiveCompanyIdState(storedCompanyId);
    }
  }, []);

  const login = (
    userData: AuthUser,
    tokens: { accessToken: string; refreshToken: string }
  ) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);

    // Set primary company as active if available
    if (userData.primaryCompanyId) {
      setActiveCompanyIdState(userData.primaryCompanyId);
      localStorage.setItem("activeCompanyId", userData.primaryCompanyId);
    }
  };

  const logout = () => {
    setUser(null);
    setActiveCompanyIdState(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("activeCompanyId");
  };

  const hasRole = (roles: Role | Role[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  const setActiveCompanyId = (companyId: string) => {
    setActiveCompanyIdState(companyId);
    localStorage.setItem("activeCompanyId", companyId);
  };

  // Permission checks based on backend permission matrix
  const canCreateUser = (targetRole: Role): boolean => {
    if (!user) return false;

    switch (user.role) {
      case Role.SUPER_ADMIN:
        return true; // Can create any role
      case Role.ADMIN:
        return [Role.MANAGER, Role.VIEWER].includes(targetRole);
      case Role.MANAGER:
        return targetRole === Role.VIEWER;
      default:
        return false;
    }
  };

  const canUpdateUser = (targetRole: Role): boolean => {
    if (!user) return false;

    switch (user.role) {
      case Role.SUPER_ADMIN:
        return true; // Can update any role
      case Role.ADMIN:
        return [Role.MANAGER, Role.VIEWER].includes(targetRole);
      case Role.MANAGER:
        return targetRole === Role.VIEWER;
      default:
        return false;
    }
  };

  const canDeleteUser = (targetRole: Role): boolean => {
    if (!user) return false;

    switch (user.role) {
      case Role.SUPER_ADMIN:
        return [Role.ADMIN, Role.MANAGER, Role.VIEWER].includes(targetRole); // Cannot delete other SUPER_ADMIN
      case Role.ADMIN:
        return [Role.MANAGER, Role.VIEWER].includes(targetRole);
      case Role.MANAGER:
        return targetRole === Role.VIEWER;
      default:
        return false;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    hasRole,
    canCreateUser,
    canUpdateUser,
    canDeleteUser,
    activeCompanyId,
    setActiveCompanyId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
