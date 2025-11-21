// src/store/slices/authSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { Role, UserStatus } from '../../types/enums';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  companyIds: string[];
  primaryCompanyId: string | null;
}

interface AuthState {
  user: AuthUser | null;
  activeCompanyId: string | null;
}

// Load initial state from localStorage
const loadInitialState = (): AuthState => {
  try {
    const storedUser = localStorage.getItem('user');
    const storedCompanyId = localStorage.getItem('activeCompanyId');

    return {
      user: storedUser ? JSON.parse(storedUser) : null,
      activeCompanyId: storedCompanyId || null,
    };
  } catch (e) {
    console.error('Failed to load auth state from localStorage:', e);
    return {
      user: null,
      activeCompanyId: null,
    };
  }
};

const initialState: AuthState = loadInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (
      state,
      action: PayloadAction<{
        userData: AuthUser;
        tokens: { accessToken: string; refreshToken: string };
      }>
    ) => {
      const { userData, tokens } = action.payload;
      state.user = userData;

      // Persist to localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);

      // Set primary company as active if available
      if (userData.primaryCompanyId) {
        state.activeCompanyId = userData.primaryCompanyId;
        localStorage.setItem('activeCompanyId', userData.primaryCompanyId);
      }
    },

    logout: (state) => {
      state.user = null;
      state.activeCompanyId = null;

      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('activeCompanyId');
    },

    setActiveCompanyId: (state, action: PayloadAction<string>) => {
      state.activeCompanyId = action.payload;
      localStorage.setItem('activeCompanyId', action.payload);
    },
  },
});

export const { login, logout, setActiveCompanyId } = authSlice.actions;

// Selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => !!state.auth.user;
export const selectActiveCompanyId = (state: { auth: AuthState }) => state.auth.activeCompanyId;

// Permission helper selectors
export const selectHasRole = (state: { auth: AuthState }, roles: Role | Role[]): boolean => {
  const user = state.auth.user;
  if (!user) return false;
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.role);
};

export const selectCanCreateUser = (state: { auth: AuthState }, targetRole: Role): boolean => {
  const user = state.auth.user;
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

export const selectCanUpdateUser = (state: { auth: AuthState }, targetRole: Role): boolean => {
  const user = state.auth.user;
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

export const selectCanDeleteUser = (state: { auth: AuthState }, targetRole: Role): boolean => {
  const user = state.auth.user;
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

export default authSlice.reducer;
