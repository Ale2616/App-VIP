"use client";

import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";

export function useLogin() {
  const { setProfile } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      if (data.user) {
        // Fetch profile from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          setProfile(profile);
        }
      }
      router.push("/");
    },
  });
}

export function useRegister() {
  const { setProfile } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      name,
      email,
      password,
    }: {
      name: string;
      email: string;
      password: string;
    }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      if (data.user) {
        // Small delay to let the trigger create the profile
        await new Promise((r) => setTimeout(r, 500));

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          setProfile(profile);
        }
      }
      router.push("/");
    },
  });
}
