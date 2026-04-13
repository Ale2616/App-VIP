"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appsApi } from "@/lib/api/apps";

export function useApps(category?: string, mostDownloaded?: boolean) {
  return useQuery({
    queryKey: ["apps", { category, mostDownloaded }],
    queryFn: async () => {
      if (mostDownloaded) {
        return appsApi.getMostDownloaded();
      }
      if (category) {
        return appsApi.getByCategory(category);
      }
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

export function useTrackDownload() {
  return useMutation({
    mutationFn: (id: string) => appsApi.trackDownload(id),
  });
}

export function useCreateApp() {
  return useMutation({
    mutationFn: (data: Parameters<typeof appsApi.create>[0]) => appsApi.create(data),
  });
}

export function useUpdateApp() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof appsApi.update>[1] }) =>
      appsApi.update(id, data),
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

export function useUploadImage() {
  return useMutation({
    mutationFn: (file: File) => appsApi.uploadImage(file),
  });
}
