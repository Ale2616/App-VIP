import { supabase } from "@/lib/supabase";
import type { App } from "@/types";

export const appsApi = {
  getAll: async (): Promise<{ apps: App[] }> => {
    const { data, error } = await supabase
      .from("apps")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { apps: data || [] };
  },

  getByCategory: async (category: string): Promise<{ apps: App[] }> => {
    const { data, error } = await supabase
      .from("apps")
      .select("*")
      .eq("category", category)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { apps: data || [] };
  },

  getMostDownloaded: async (limit: number = 10): Promise<{ apps: App[] }> => {
    const { data, error } = await supabase
      .from("apps")
      .select("*")
      .order("download_count", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { apps: data || [] };
  },

  getById: async (id: string): Promise<{ app: App }> => {
    const { data, error } = await supabase
      .from("apps")
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
      .from("apps")
      .insert(appData)
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
      .from("apps")
      .update({ ...appData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { app: data };
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const { error } = await supabase.from("apps").delete().eq("id", id);

    if (error) throw error;
    return { message: "Aplicación eliminada" };
  },

  trackDownload: async (id: string): Promise<{ download_url: string }> => {
    // Increment download count
    const { data: app } = await supabase
      .from("apps")
      .select("download_count, download_url, file_path")
      .eq("id", id)
      .single();

    if (!app) throw new Error("App not found");

    await supabase
      .from("apps")
      .update({ download_count: (app.download_count || 0) + 1 })
      .eq("id", id);

    // If there's a file in storage, generate a URL
    if (app.file_path) {
      const { data: urlData } = supabase.storage
        .from("app-files")
        .getPublicUrl(app.file_path);
      return { download_url: urlData.publicUrl };
    }

    return { download_url: app.download_url || "" };
  },

  uploadFile: async (
    file: File,
    folder: string = "uploads"
  ): Promise<{ path: string; url: string }> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error } = await supabase.storage
      .from("app-files")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("app-files")
      .getPublicUrl(fileName);

    return { path: fileName, url: urlData.publicUrl };
  },

  uploadImage: async (file: File): Promise<{ url: string }> => {
    const result = await appsApi.uploadFile(file, "images");
    return { url: result.url };
  },
};
