"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useAuthStore } from "@/store/auth-store";
import { authApi } from "@/lib/api/auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { initialize, setAuth, logout } = useAuthStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent double-execution in React Strict Mode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Step 1: Mark as authenticated from localStorage token (sets isAuthenticated + token)
    initialize();

    // Step 2: Fetch user data if token exists (sets user + isAdmin)
    if (typeof window === "undefined") return;
    
    const token = localStorage.getItem("token");
    if (token) {
      console.log("[AUTH PROVIDER] Token found in localStorage, fetching user data...");
      authApi
        .getMe()
        .then(({ user }) => {
          console.log("[AUTH PROVIDER] ✅ User data fetched successfully:", user.email, "| role:", user.role);
          setAuth(user, token);
        })
        .catch((err) => {
          const status = err.response?.status;
          const data = err.response?.data;
          console.error("[AUTH PROVIDER] ❌ Failed to fetch user data. Status:", status, "Data:", data);

          if (status === 401) {
            console.log("[AUTH PROVIDER] Token is invalid/expired. Clearing...");
            logout();
          } else {
            console.log("[AUTH PROVIDER] Non-401 error. Keeping token, user may still be valid.");
          }
        });
    } else {
      console.log("[AUTH PROVIDER] No token in localStorage. User is not authenticated.");
    }
  }, [initialize, setAuth, logout]);

  return <>{children}</>;
}
