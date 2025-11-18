// src/router/index.ts
import { createRouter } from "@tanstack/react-router";
import {
  rootRoute,
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

const routeTree = rootRoute.addChildren([
  indexRoute,
  usersRoute,
  newUserRoute,
  userProfileRoute,
  devicesRoute,
  newDeviceRoute,
  deviceProfileRoute,
  companiesRoute,
  newCompanyRoute,
  companyProfileRoute,
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
