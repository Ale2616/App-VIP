import type { Response, NextFunction } from "express";
import { verifyToken } from "@/utils/jwt";
import type { AuthRequest } from "@/types";

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  console.log("[AUTH MIDDLEWARE] authenticate() - Authorization header:", authHeader ? `"${authHeader.substring(0, 30)}..."` : "MISSING");

  if (!authHeader?.startsWith("Bearer ")) {
    console.error("[AUTH MIDDLEWARE] ERROR: No Bearer token found in header");
    res.status(401).json({ message: "No token provided", error: "Authorization header must start with Bearer" });
    return;
  }

  const token = authHeader.split(" ")[1];
  console.log("[AUTH MIDDLEWARE] Token length:", token.length);

  try {
    const payload = verifyToken(token);
    console.log("[AUTH MIDDLEWARE] Token verified. User:", JSON.stringify({ userId: payload.userId, role: payload.role }));
    req.user = payload;
    next();
  } catch (error: any) {
    console.error("[AUTH MIDDLEWARE] ERROR: Invalid token -", error.message);
    res.status(401).json({ message: "Invalid token", error: error.message });
    return;
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  console.log("[AUTH MIDDLEWARE] requireAdmin() - User role:", req.user?.role);

  if (req.user?.role !== "admin") {
    console.error("[AUTH MIDDLEWARE] ERROR: User is not admin. Role:", req.user?.role);
    res.status(403).json({ message: "Admin access required", error: `User role is "${req.user?.role}", expected "admin"` });
    return;
  }
  console.log("[AUTH MIDDLEWARE] Admin access granted");
  next();
}
