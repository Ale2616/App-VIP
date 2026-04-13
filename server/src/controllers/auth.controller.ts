import type { Request, Response } from "express";
import { AuthService } from "@/services/auth.service";
import type { AuthRequest } from "@/types";

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;
      console.log("[AUTH CONTROLLER] POST /auth/register - email:", email);
      const result = await this.authService.register({ name, email, password });
      console.log("[AUTH CONTROLLER] Registration successful for:", email);
      res.status(201).json(result);
    } catch (error: any) {
      console.error("[AUTH CONTROLLER] Registration error:", error.message);
      res.status(400).json({ message: error.message, error: error.message });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      console.log("================================================");
      console.log(">>> INTENTO DE LOGIN RECIBIDO <<<");
      console.log(">>> req.body:", JSON.stringify(req.body));
      console.log(">>> req.headers.origin:", req.headers.origin);
      console.log(">>> req.headers.host:", req.headers.host);
      console.log("================================================");

      const { email, password } = req.body;

      if (!email || !password) {
        console.error("[AUTH CONTROLLER] Missing email or password!");
        res.status(401).json({
          message: "Faltan credenciales: email y password son requeridos",
          error: "Missing credentials",
          receivedBody: JSON.stringify(req.body),
        });
        return;
      }

      console.log("[AUTH CONTROLLER] POST /auth/login");
      console.log("[AUTH CONTROLLER] Email:", email);
      console.log("[AUTH CONTROLLER] Password length:", password?.length);

      const result = await this.authService.login({ email, password });

      console.log("[AUTH CONTROLLER] ✅ Login exitoso!");
      console.log("[AUTH CONTROLLER] User:", JSON.stringify(result.user));
      console.log("[AUTH CONTROLLER] Token length:", result.token?.length);

      res.status(200).json(result);
    } catch (error: any) {
      console.error("[AUTH CONTROLLER] ❌ Login error:", error.message);
      res.status(401).json({ message: error.message, error: error.message });
    }
  };

  getMe = async (req: AuthRequest, res: Response) => {
    try {
      console.log("[AUTH CONTROLLER] GET /auth/me - req.user:", JSON.stringify(req.user));

      if (!req.user?.userId) {
        console.error("[AUTH CONTROLLER] No userId in req.user");
        res.status(401).json({ message: "Not authenticated", error: "No userId in request" });
        return;
      }

      const user = await this.authService.getUserById(req.user.userId);
      if (!user) {
        console.error("[AUTH CONTROLLER] User not found for userId:", req.user.userId);
        res.status(404).json({ message: "User not found", error: "User does not exist" });
        return;
      }
      console.log("[AUTH CONTROLLER] User found:", JSON.stringify(user));
      res.status(200).json({ user });
    } catch (error: any) {
      console.error("[AUTH CONTROLLER] getMe error:", error.message);
      res.status(500).json({ message: error.message, error: error.message });
    }
  };
}
