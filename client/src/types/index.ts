// ─── Auth ───────────────────────────────────────────────
export interface Profile {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar_url?: string | null;
  created_at: string;
}

// Legacy alias for backward compatibility
export type User = Profile;

// ─── Apps ───────────────────────────────────────────────
export interface App {
  id: string;
  name: string;
  description: string;
  version: string;
  icon_url: string | null;
  image_url: string | null;
  download_url: string | null;
  file_path: string | null;
  file_size: number;
  category: string;
  download_count: number;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Activity Log ───────────────────────────────────────
export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

// ─── API Responses ──────────────────────────────────────
export interface AppsResponse {
  apps: App[];
}

export interface AppResponse {
  app: App;
}
