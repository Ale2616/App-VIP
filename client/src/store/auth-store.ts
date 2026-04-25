import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types";

interface AuthState {
  profile: Profile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
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
  isLoading: true,

  setProfile: (profile) => {
    set({
      profile,
      isAuthenticated: true,
      isAdmin: profile.role === "admin",
      isLoading: false,
    });
  },

  clearAuth: () => {
    set({
      profile: null,
      isAuthenticated: false,
      isAdmin: false,
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
      isLoading: false,
    });
  },
}));
