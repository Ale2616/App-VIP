import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { FRONTEND_URL } from "@/config/env";

const app = express();

// Log HTTP requests
app.use(morgan("dev"));

// Protect HTTP headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Parse JSON body
app.use(express.json());

// Handle cookies
app.use(cookieParser());

// Serve uploaded images as static files (fallback when Cloudinary is not configured)
const uploadsDir = path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsDir));

// Health check route (always available)
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("========================================");
  console.error("[APP] GLOBAL ERROR HANDLER");
  console.error("========================================");
  console.error("[APP] Error message:", err.message);
  console.error("[APP] Error stack:", err.stack);
  console.error("[APP] Error code:", err.code);
  console.error("========================================");

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    error: err.message,
    code: err.code,
  });
});

export function setupRoutes() {
  // Lazy import to avoid loading TypeORM entities before DB initialization
  const { AppDataSource } = require("@/database/data-source");
  const { createAuthRoutes } = require("@/routes/auth.routes");
  const { createAppRoutes } = require("@/routes/app.routes");
  const { createVisitRoutes } = require("@/routes/visit.routes");
  const { createCategoryRoutes } = require("@/routes/category.routes");
  const { AuthController } = require("@/controllers/auth.controller");
  const { AppController } = require("@/controllers/app.controller");
  const { VisitController } = require("@/controllers/visit.controller");
  const { AuthService } = require("@/services/auth.service");
  const { AppService } = require("@/services/app.service");
  const { VisitService } = require("@/services/visit.service");
  const { CloudinaryService } = require("@/services/cloudinary.service");
  const { UserRepository } = require("@/repositories/user.repository");
  const { AppRepository } = require("@/repositories/app.repository");
  const { CategoryRepository } = require("@/repositories/category.repository");
  const { VisitRepository } = require("@/repositories/visit.repository");

  const userRepository = new UserRepository(AppDataSource);
  const appRepository = new AppRepository(AppDataSource);
  const categoryRepository = new CategoryRepository(AppDataSource);
  const visitRepository = new VisitRepository(AppDataSource);

  const authService = new AuthService(userRepository);
  const cloudinaryService = new CloudinaryService();
  const appService = new AppService(appRepository, categoryRepository);
  const visitService = new VisitService(visitRepository);

  const authController = new AuthController(authService);
  const appController = new AppController(appService, cloudinaryService);
  const visitController = new VisitController(visitService);

  // Seed categories on startup
  appService.seedCategories().catch(console.error);

  app.use("/api/auth", createAuthRoutes(authController));
  app.use("/api/apps", createAppRoutes(appController));
  app.use("/api/visits", createVisitRoutes(visitController));
  app.use("/api/categories", createCategoryRoutes());
}

export default app;
