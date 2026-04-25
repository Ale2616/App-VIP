"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";

export function useLogActivity() {
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      action,
      details,
    }: {
      action: string;
      details?: Record<string, unknown>;
    }) => {
      if (!profile) return;

      const { error } = await supabase.from("activity_logs").insert({
        user_id: profile.id,
        action,
        details: details || {},
      });

      if (error) throw error;
    },
  });
}

export function useActivityLogs() {
  const { profile } = useAuthStore();

  return useQuery({
    queryKey: ["activity_logs", profile?.id],
    queryFn: async () => {
      if (!profile) return [];

      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile,
  });
}
