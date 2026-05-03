"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";

/**
 * Enriquece el perfil de la base de datos con datos de la sesión de Supabase Auth.
 * Esto asegura que email y created_at siempre tengan valor,
 * incluso si la tabla profiles no los tiene populados.
 */
function enrichProfile(profile: Profile, authUser: User): Profile {
  return {
    ...profile,
    email: profile.email || authUser.email || "",
    created_at: profile.created_at || authUser.created_at || new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setProfile, clearAuth, setLoading } = useAuthStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Fetch current session on mount
    const initAuth = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            setProfile(enrichProfile(profile, session.user));
          } else {
            clearAuth();
          }
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      }
    };

    initAuth();

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          setProfile(enrichProfile(profile, session.user));
        }
      } else if (event === "SIGNED_OUT") {
        clearAuth();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setProfile, clearAuth, setLoading]);

  return <>{children}</>;
}
