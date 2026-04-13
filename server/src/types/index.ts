import type { Request } from "express";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface AppResponse {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  imageUrl: string;
  downloadUrl: string;
  categoryId: string;
  categoryName: string;
  downloadCount: number;
  createdAt: Date;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
}
