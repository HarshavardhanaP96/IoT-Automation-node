// src/router/routeConfigs.ts
import { createRoute, createRootRoute } from "@tanstack/react-router";
import Layout from "../components/layout/Layout";
import Dashboard from "../pages/Dashboard/Dashboard";
import UsersPage from "../pages/Users/UsersPage";
import UserProfilePage from "../pages/Users/UserProfile";
import NewUserPage from "../pages/Users/NewUserPage";
import DevicesPage from "../pages/Devices/DevicesPage";
import DeviceProfilePage from "../pages/Devices/DeviceProfile";
import NewDevicePage from "../pages/Devices/NewDevicePage";
// import EditDevicePage from "../pages/Devices/EditDevicePage";
// import DeviceChildrenPage from "../pages/Devices/DeviceChildrenPage";

import CompaniesPage from "../pages/Companies/CompaniesPage";
import CompanyProfile from "../pages/Companies/CompanyProfile";
import NewCompanyPage from "../pages/Companies/NewCompanyPage";

// --- Root Route ---
export const rootRoute = createRootRoute({
  component: Layout,
});

// --- Dashboard ---
export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

// --- User Routes ---
export const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users",
  component: UsersPage,
});

export const userProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users/$id",
  component: UserProfilePage,
});

export const newUserRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users/new",
  component: NewUserPage,
});

// --- Device Routes ---
export const devicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/devices",
  component: DevicesPage,
});

export const newDeviceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/devices/new",
  component: NewDevicePage,
});

export const deviceProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/devices/$id",
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
  getParentRoute: () => rootRoute,
  path: "/companies",
  component: CompaniesPage,
});

// New company route
export const newCompanyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/companies/new",
  component: NewCompanyPage,
});

// Company profile route
export const companyProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/companies/$id",
  component: CompanyProfile,
});

// --- Optional grouped export ---
export const deviceRoutes = [
  devicesRoute,
  newDeviceRoute,
  deviceProfileRoute,
  // editDeviceRoute,
  // deviceChildrenRoute,
];
