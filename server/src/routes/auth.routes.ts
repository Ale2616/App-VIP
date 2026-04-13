import { Router } from "express";
import { AuthController } from "@/controllers/auth.controller";
import { authenticate } from "@/middlewares/auth.middleware";

const router = Router();

export function createAuthRoutes(authController: AuthController) {
  router.post("/register", authController.register);
  router.post("/login", authController.login);
  router.get("/me", authenticate, authController.getMe);

  return router;
}
