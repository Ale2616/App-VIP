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

/** Obtiene el perfil desde la tabla profiles y lo inyecta en el store. */
async function loadProfileFromDB(
  userId: string,
  authUser: User,
  setProfile: (p: Profile) => void,
  clearAuth: () => void
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profile) {
    setProfile(enrichProfile(profile, authUser));
  } else {
    clearAuth();
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setProfile, clearAuth, setLoading, isLoading } = useAuthStore();
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
          await loadProfileFromDB(session.user.id, session.user, setProfile, clearAuth);
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      }
    };

    initAuth();

    // Listen for auth state changes (login, logout, token refresh, role update)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (
        (event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED") &&
        session?.user
      ) {
        // Siempre re-lee el rol desde la tabla profiles para evitar datos obsoletos
        await loadProfileFromDB(session.user.id, session.user, setProfile, clearAuth);
      } else if (event === "SIGNED_OUT") {
        clearAuth();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setProfile, clearAuth, setLoading]);

  // ── Auth Gate: pantalla de carga mientras se verifica la sesión ──
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black">
        <div className="relative mb-6">
          <div className="w-12 h-12 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
        </div>
        <p className="text-sm text-slate-400 font-medium animate-pulse">
          Verificando sesión...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
