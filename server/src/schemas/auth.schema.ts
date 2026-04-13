import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createAppSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  iconUrl: z.string().url(),
  imageUrl: z.string().url(),
  downloadUrl: z.string().url(),
  categoryId: z.string().uuid(),
});

export const updateAppSchema = createAppSchema.partial();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateAppInput = z.infer<typeof createAppSchema>;
export type UpdateAppInput = z.infer<typeof updateAppSchema>;
