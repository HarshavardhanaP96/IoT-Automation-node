// src/router/routeConfigs.ts

import { createRoute, createRootRoute, redirect } from "@tanstack/react-router";
import { lazy } from "react";
import { isAuthenticatedSync } from "../utils/auth";

// Lazy load all page components for code splitting
const Layout = lazy(() => import("../components/layout/Layout"));
const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard"));
const LoginPage = lazy(() => import("../pages/Auth/LoginPage"));

// User pages
const UsersPage = lazy(() => import("../pages/Users/UsersPage"));
const UserProfilePage = lazy(() => import("../pages/Users/UserProfile"));
const NewUserPage = lazy(() => import("../pages/Users/NewUserPage"));

// Device pages
const DevicesPage = lazy(() => import("../pages/Devices/DevicesPage"));
const DeviceProfilePage = lazy(() => import("../pages/Devices/DeviceProfile"));
const NewDevicePage = lazy(() => import("../pages/Devices/NewDevicePage"));

// Company pages
const CompaniesPage = lazy(() => import("../pages/Companies/CompaniesPage"));
const CompanyProfile = lazy(() => import("../pages/Companies/CompanyProfile"));
const NewCompanyPage = lazy(() => import("../pages/Companies/NewCompanyPage"));

// Profile page
const ProfilePage = lazy(() => import("../pages/Profile/ProfilePage"));

// Analytics page
const AnalyticsPage = lazy(() => import("../pages/Analytics/AnalyticsPage"));

// 1. --- Bare Root Route (No Component, just the entry point) ---
export const rootRoute = createRootRoute({}); // <--- No component here

// 2. --- Layout Route (Wrapper for Protected Routes) ---
export const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout", // Give it an ID for clarity
  component: Layout, // <--- This now renders your main layout

  // 🔑 Auth Check (Only applies to routes inside this 'layout' route tree)
  beforeLoad: ({ location }) => {
    const isAuthenticated = isAuthenticatedSync();
    const loginPath = "/login";

    // If not authenticated, redirect to login page
    if (!isAuthenticated) {
      throw redirect({
        to: loginPath,
        search: { redirect: location.pathname },
      });
    }
    return {};
  },
});

// 3. --- Login Route (Placed directly under the Bare Root) ---
export const loginRoute = createRoute({
  getParentRoute: () => rootRoute, // <--- Sibling to the 'layout' route
  path: "/login",
  component: LoginPage,

  // Optional: Redirect authenticated users away from the login page
  beforeLoad: () => {
    const isAuthenticated = isAuthenticatedSync();
    if (isAuthenticated) {
      throw redirect({ to: "/" });
    }
    return {};
  },
});

// --- Dashboard ---
export const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/",
  component: Dashboard,
});

// --- User Routes ---
export const usersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "users",
  component: UsersPage,
});

export const userProfileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "users/$id",
  component: UserProfilePage,
});

export const profileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "profile",
  component: ProfilePage,
});

export const newUserRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "users/new",
  component: NewUserPage,
});

// --- Device Routes ---
export const devicesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "devices",
  component: DevicesPage,
});

export const newDeviceRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "devices/new",
  component: NewDevicePage,
});

export const deviceProfileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "devices/$id",
  component: DeviceProfilePage,
});

// Optional nested routes (if needed later)
// export const editDeviceRoute = createRoute({
//   getParentRoute: () => rootRoute,
//   path: "/devices/$id/edit",
//   component: EditDevicePage,
// });

// export const deviceChildrenRoute = createRoute({
//   getParentRoute: () => rootRoute,
//   path: "/devices/$id/children",
//   component: DeviceChildrenPage,
// });

// Existing companies route
export const companiesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "companies",
  component: CompaniesPage,
});

// New company route
export const newCompanyRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "companies/new",
  component: NewCompanyPage,
});

// Company profile route
export const companyProfileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "companies/$id",
  component: CompanyProfile,
});

// Analytics route
export const analyticsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "analytics",
  component: AnalyticsPage,
});

// --- Optional grouped export ---
export const deviceRoutes = [
  devicesRoute,
  newDeviceRoute,
  deviceProfileRoute,
  // editDeviceRoute,
  // deviceChildrenRoute,
];
