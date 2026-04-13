export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface App {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  imageUrl: string;
  downloadUrl: string;
  categoryId: string;
  categoryName: string;
  downloadCount: number;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AppsResponse {
  apps: App[];
}

export interface AppResponse {
  app: App;
}

export interface VisitCountResponse {
  visits: number;
}
