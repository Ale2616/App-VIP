import type { App } from "@/types";
import { supabase } from "@/lib/supabase";

export const appsApi = {
  getAll: async (): Promise<{ apps: App[] }> => {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { apps: data || [] };
  },

  getByCategory: async (category: string): Promise<{ apps: App[] }> => {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("category", category)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { apps: data || [] };
  },

  getMostDownloaded: async (limit: number = 10): Promise<{ apps: App[] }> => {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("download_count", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return { apps: data || [] };
  },

  getById: async (id: string): Promise<{ app: App }> => {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
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
    const { data, error } = await supabase
      .from("applications")
      .insert([appData])
      .select()
      .single();
    if (error) throw error;
    return { app: data };
  },

  update: async (
    id: string,
    appData: Partial<App>
  ): Promise<{ app: App }> => {
    const { data, error } = await supabase
      .from("applications")
      .update({ ...appData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return { app: data };
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { message: "Aplicación eliminada" };
  },

  trackDownload: async (id: string): Promise<{ download_url: string }> => {
    const { data: app, error: fetchError } = await supabase
      .from("applications")
      .select("download_count, download_url")
      .eq("id", id)
      .single();

    if (fetchError || !app) throw new Error("App not found");

    // Supabase RPC is normally recommended for this, but we'll try a regular update.
    // If the RLS blocks it (e.g., for anon users), we'll silently catch the error
    // so the download still proceeds.
    await supabase
      .from("applications")
      .update({ download_count: (app.download_count || 0) + 1 })
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.warn("No permission to update download count");
      });

    return { download_url: app.download_url || "" };
  },

  uploadFile: async (_file: File, _folder?: string): Promise<{ path: string; url: string }> => {
    throw new Error("Upload de archivos deshabilitado. Usa enlaces directos.");
  },

  uploadImage: async (_file: File): Promise<{ url: string }> => {
    throw new Error("Upload de imágenes deshabilitado.");
  },
};

