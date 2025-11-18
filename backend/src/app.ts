// src/app.ts
import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import companyRoutes from "./routes/company.routes";
import deviceRoutes from "./routes/device.routes";
import { errorHandler } from "./middlewares/error.middleware";
import { authenticate } from "./middlewares/auth.middleware";
import { activeCompanyMiddleware } from "./middlewares/activeCompany.middleware";

const app: Application = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS
app.use(morgan("dev")); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/v1/auth", authRoutes); // Authentication routes (login, refresh, etc.)

// --- PROTECTED ROUTES ---
// 1. Authenticate (sets req.user)
//testing comment
app.use("/api/v1", authenticate);

// 2. Active Company Context (sets req.activeCompanyId and performs security check)
// This is applied to all protected API routes
//testing comment
app.use("/api/v1", activeCompanyMiddleware);

app.use("/api/v1/users", userRoutes); // User management routes
app.use("/api/v1/companies", companyRoutes); // Company management routes
app.use("/api/v1/devices", deviceRoutes); // Device management routes

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
