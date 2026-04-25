import type { App } from "@/types";

const SUPABASE_URL = "https://wzeklbcmloxxvzqtxocq.supabase.co";
const SUPABASE_KEY = "sb_publishable_Irc_VuEUm_TMrVfB9dgf3g_UxAyGRVG";
const TABLE = "applications";
const BASE = `${SUPABASE_URL}/rest/v1/${TABLE}`;

const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

async function query(url: string, opts?: RequestInit) {
  const res = await fetch(url, { ...opts, headers: { ...headers, ...opts?.headers } });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body as any)?.message || `Error ${res.status}`);
  return body;
}

export const appsApi = {
  getAll: async (): Promise<{ apps: App[] }> => {
    const data = await query(`${BASE}?select=*&order=created_at.desc`);
    return { apps: data || [] };
  },

  getByCategory: async (category: string): Promise<{ apps: App[] }> => {
    const data = await query(`${BASE}?select=*&category=eq.${encodeURIComponent(category)}&order=created_at.desc`);
    return { apps: data || [] };
  },

  getMostDownloaded: async (limit: number = 10): Promise<{ apps: App[] }> => {
    const data = await query(`${BASE}?select=*&order=download_count.desc&limit=${limit}`);
    return { apps: data || [] };
  },

  getById: async (id: string): Promise<{ app: App }> => {
    const data = await query(`${BASE}?select=*&id=eq.${id}`, {
      headers: { "Accept": "application/vnd.pgrst.object+json" },
    });
    return { app: data };
  },

  create: async (appData: {
    name: string;
    description: string;
    version?: string;
    icon_url?: string;
    image_url?: string;
    download_url?: string;
    file_path?: string;
    file_size?: number;
    category: string;
    uploaded_by?: string;
  }): Promise<{ app: App }> => {
    const data = await query(BASE, {
      method: "POST",
      headers: { "Prefer": "return=representation" },
      body: JSON.stringify(appData),
    });
    return { app: Array.isArray(data) ? data[0] : data };
  },

  update: async (
    id: string,
    appData: Partial<App>
  ): Promise<{ app: App }> => {
    const data = await query(`${BASE}?id=eq.${id}`, {
      method: "PATCH",
      headers: { "Prefer": "return=representation" },
      body: JSON.stringify({ ...appData, updated_at: new Date().toISOString() }),
    });
    return { app: Array.isArray(data) ? data[0] : data };
  },

  delete: async (id: string): Promise<{ message: string }> => {
    await query(`${BASE}?id=eq.${id}`, { method: "DELETE" });
    return { message: "Aplicación eliminada" };
  },

  trackDownload: async (id: string): Promise<{ download_url: string }> => {
    // Fetch the app
    const app = await query(`${BASE}?select=download_count,download_url&id=eq.${id}`, {
      headers: { "Accept": "application/vnd.pgrst.object+json" },
    });

    if (!app) throw new Error("App not found");

    // Increment download count
    await query(`${BASE}?id=eq.${id}`, {
      method: "PATCH",
      headers: { "Prefer": "return=minimal" },
      body: JSON.stringify({ download_count: (app.download_count || 0) + 1 }),
    });

    return { download_url: app.download_url || "" };
  },

  // Kept for compatibility — no longer used for uploads
  uploadFile: async (_file: File, _folder?: string): Promise<{ path: string; url: string }> => {
    throw new Error("Upload de archivos deshabilitado. Usa enlaces directos.");
  },

  uploadImage: async (_file: File): Promise<{ url: string }> => {
    throw new Error("Upload de imágenes deshabilitado.");
  },
};
