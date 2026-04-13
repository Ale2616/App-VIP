export const NODE_ENV = process.env.NODE_ENV || "development";
export const PORT = Number(process.env.PORT) || 4000;
export const DB_NAME = process.env.DB_NAME || "postgres";
export const DATABASE_URL = process.env.DATABASE_URL;
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const FRONTEND_URL = (process.env.FRONTEND_URL as string) || "http://localhost:3000";
export const CLOUDINARY_URL = process.env.CLOUDINARY_URL as string;
