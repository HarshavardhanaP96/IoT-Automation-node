import { CorsOptions } from "cors";
import { ENV } from "./env";

export const corsOptions: CorsOptions = {
  origin: ENV.CORS_ORIGIN,
  credentials: true,
};
