import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "4000", 10),
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET || "Test1234567",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "Test1233586",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  JWT_ISSUER: process.env.JWT_ISSUER || "iot-platform-api",
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || "iot-platform-client",
};
