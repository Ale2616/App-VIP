import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types";

interface AuthState {
  profile: Profile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isVip: boolean;
  isLoading: boolean;
  setProfile: (profile: Profile) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  isAuthenticated: false,
  isAdmin: false,
  isVip: false,
  isLoading: true,

  setProfile: (profile) => {
    set({
      profile,
      isAuthenticated: true,
      isAdmin: profile.role === "admin",
      isVip: ["vip", "elite", "admin"].includes(profile.role),
      isLoading: false,
    });
  },

  clearAuth: () => {
    set({
      profile: null,
      isAuthenticated: false,
      isAdmin: false,
      isVip: false,
      isLoading: false,
    });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({
      profile: null,
      isAuthenticated: false,
      isAdmin: false,
      isVip: false,
      isLoading: false,
    });
  },
}));
