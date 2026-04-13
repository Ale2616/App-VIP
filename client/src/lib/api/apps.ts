import { api } from "@/lib/api-client";
import type { App, AppsResponse, AppResponse } from "@/types";

export const appsApi = {
  getAll: async (): Promise<AppsResponse> => {
    console.log("[APPS API] GET /apps");
    const { data } = await api.get<AppsResponse>("/apps");
    return data;
  },

  getByCategory: async (categorySlug: string): Promise<AppsResponse> => {
    console.log("[APPS API] GET /apps?category=", categorySlug);
    const { data } = await api.get<AppsResponse>(`/apps?category=${categorySlug}`);
    return data;
  },

  getMostDownloaded: async (limit: number = 10): Promise<AppsResponse> => {
    console.log("[APPS API] GET /apps?mostDownloaded=true&limit=", limit);
    const { data } = await api.get<AppsResponse>(`/apps?mostDownloaded=true&limit=${limit}`);
    return data;
  },

  getById: async (id: string): Promise<AppResponse> => {
    console.log("[APPS API] GET /apps/", id);
    const { data } = await api.get<AppResponse>(`/apps/${id}`);
    return data;
  },

  create: async (appData: {
    name: string;
    description: string;
    iconUrl: string;
    imageUrl: string;
    downloadUrl: string;
    categoryId: string;
  }): Promise<AppResponse> => {
    console.log("========================================");
    console.log("[APPS API] POST /apps - CREATE APP");
    console.log("========================================");
    console.log("[APPS API] Payload:", JSON.stringify(appData, null, 2));
    console.log("========================================");

    try {
      const { data } = await api.post<AppResponse>("/apps", appData);
      console.log("[APPS API] Response:", JSON.stringify(data, null, 2));
      return data;
    } catch (error: any) {
      console.error("[APPS API] ERROR creating app:", error);
      console.error("[APPS API] Error response:", error.response?.data);
      console.error("[APPS API] Error status:", error.response?.status);
      throw error;
    }
  },

  update: async (
    id: string,
    appData: Partial<{
      name: string;
      description: string;
      iconUrl: string;
      imageUrl: string;
      downloadUrl: string;
      categoryId: string;
    }>
  ): Promise<AppResponse> => {
    console.log("[APPS API] PUT /apps/", id);
    const { data } = await api.put<AppResponse>(`/apps/${id}`, appData);
    return data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    console.log("[APPS API] DELETE /apps/", id);
    const { data } = await api.delete<{ message: string }>(`/apps/${id}`);
    return data;
  },

  trackDownload: async (id: string): Promise<{ downloadUrl: string }> => {
    console.log("[APPS API] POST /apps/", id, "/download");
    const { data } = await api.post<{ downloadUrl: string }>(`/apps/${id}/download`);
    return data;
  },

  uploadImage: async (file: File): Promise<{ url: string }> => {
    console.log("========================================");
    console.log("[APPS API] POST /apps/upload - UPLOAD IMAGE");
    console.log("========================================");
    console.log("[APPS API] File:", { name: file.name, type: file.type, size: file.size });

    const formData = new FormData();
    formData.append("image", file);

    try {
      const { data } = await api.post<{ url: string }>("/apps/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("[APPS API] Upload response:", JSON.stringify(data));
      return data;
    } catch (error: any) {
      console.error("[APPS API] ERROR uploading image:", error);
      console.error("[APPS API] Error response:", error.response?.data);
      console.error("[APPS API] Error status:", error.response?.status);
      throw error;
    }
  },
};
