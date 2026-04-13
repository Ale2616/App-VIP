"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { visitsApi } from "@/lib/api/visits";

export function useVisitCount() {
  return useQuery({
    queryKey: ["visitCount"],
    queryFn: () => visitsApi.getTotalVisits(),
  });
}

export function useTrackVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => visitsApi.trackVisit(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visitCount"] });
    },
  });
}
