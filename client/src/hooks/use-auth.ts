"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";

export function useLogin() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (data) => {
      console.log("========================================");
      console.log("[USE LOGIN HOOK] onSuccess called");
      console.log("[USE LOGIN HOOK] User:", JSON.stringify(data.user));
      console.log("[USE LOGIN HOOK] Token length:", data.token?.length);
      console.log("========================================");

      console.log("[USE LOGIN HOOK] Calling setAuth...");
      setAuth(data.user, data.token);
      console.log("[USE LOGIN HOOK] setAuth done. isAuthenticated:", useAuthStore.getState().isAuthenticated);
      console.log("[USE LOGIN HOOK] isAdmin:", useAuthStore.getState().isAdmin);

      console.log("[USE LOGIN HOOK] Redirecting to /");
      router.push("/");
    },
    onError: (error: any) => {
      console.error("[USE LOGIN HOOK] mutation error:", error.message);
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ name, email, password }: { name: string; email: string; password: string }) =>
      authApi.register(name, email, password),
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      router.push("/");
    },
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => authApi.getMe(),
    enabled: !!localStorage.getItem("token"),
  });
}
