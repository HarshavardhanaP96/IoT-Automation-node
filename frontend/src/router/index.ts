// src/router/index.ts

import { createRouter } from "@tanstack/react-router";
import {
  rootRoute, // The bare root
  layoutRoute, // The new layout wrapper
  loginRoute, // Sibling route, outside the layout
  indexRoute,
  //users
  usersRoute,
  newUserRoute,
  userProfileRoute,

  //devices
  devicesRoute,
  newDeviceRoute,
  deviceProfileRoute,

  //companies
  companiesRoute,
  newCompanyRoute,
  companyProfileRoute,
} from "./routeConfigs";

// 1. Define the protected routes that live under the layout
const protectedRoutes = [
  indexRoute, // /
  usersRoute, // /users
  newUserRoute, // /users/new
  userProfileRoute, // /users/$id
  devicesRoute, // /devices
  newDeviceRoute,
  deviceProfileRoute,
  companiesRoute,
  newCompanyRoute,
  companyProfileRoute,
];

// 2. Build the tree: rootRoute has layoutRoute and loginRoute as children
const routeTree = rootRoute.addChildren([
  loginRoute, // Sibling to layoutRoute (No Layout)
  layoutRoute.addChildren(protectedRoutes), // Layout wraps all protected routes
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
