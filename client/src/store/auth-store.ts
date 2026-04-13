import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,

  setAuth: (user, token) => {
    console.log("[AUTH STORE] setAuth() called");
    console.log("[AUTH STORE] User:", JSON.stringify(user));
    console.log("[AUTH STORE] Token length:", token.length);
    console.log("[AUTH STORE] Saving token to localStorage...");
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
    set({
      user,
      token,
      isAuthenticated: true,
      isAdmin: user.role === "admin",
    });
    console.log("[AUTH STORE] State updated. isAuthenticated=true, isAdmin=", user.role === "admin");
  },

  logout: () => {
    console.log("[AUTH STORE] logout() called");
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
    });
    console.log("[AUTH STORE] State cleared");
  },

  initialize: () => {
    if (typeof window === "undefined") return;
    
    const token = localStorage.getItem("token");
    console.log("[AUTH STORE] initialize() called. Token in localStorage:", token ? "YES" : "NO");
    if (token) {
      set({ token, isAuthenticated: true });
      console.log("[AUTH STORE] isAuthenticated set to true");
    }
  },
}));
