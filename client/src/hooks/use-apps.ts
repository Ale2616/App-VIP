"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appsApi } from "@/lib/api/apps";

export function useApps(category?: string, mostDownloaded?: boolean) {
  return useQuery({
    queryKey: ["apps", category, mostDownloaded],
    queryFn: () => {
      if (mostDownloaded) return appsApi.getMostDownloaded();
      if (category) return appsApi.getByCategory(category);
      return appsApi.getAll();
    },
  });
}

export function useApp(id: string) {
  return useQuery({
    queryKey: ["app", id],
    queryFn: () => appsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appData: {
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
    }) => appsApi.create(appData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });
}

export function useDeleteApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });
}

export function useTrackDownload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appsApi.trackDownload(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: (file: File) => appsApi.uploadImage(file),
  });
}

export function useUploadFile() {
  return useMutation({
    mutationFn: ({
      file,
      folder,
    }: {
      file: File;
      folder?: string;
    }) => appsApi.uploadFile(file, folder),
  });
}
