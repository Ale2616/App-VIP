"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";

function enrichProfile(profile: Partial<Profile>, authUser: User): Profile {
  return {
    ...profile,
    id: authUser.id,
    email: profile.email || authUser.email || "",
    created_at: profile.created_at || authUser.created_at || new Date().toISOString(),
    role: profile.role || "user", // Rol por defecto para que no rompa la app
  } as Profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setProfile, clearAuth, setLoading } = useAuthStore();
  const [showGate, setShowGate] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Función que inyecta la sesión de inmediato sin esperar a la base de datos
    const syncUser = async (user: User) => {
      // 1. INYECCIÓN OPTIMISTA: ¡Te iniciamos sesión de inmediato en la app!
      setProfile(enrichProfile({}, user));

      // 2. Buscamos tus datos extra en segundo plano (silenciosamente)
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile && isMounted) {
          setProfile(enrichProfile(profile, user));
        }
      } catch (error) {
        console.warn("Aviso: Datos extra de perfil no encontrados, pero la sesión sigue activa.");
      }
    };

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          await syncUser(session.user);
        } else {
          clearAuth();
        }
      } catch (error) {
        console.error("Error validando sesión local:", error);
      } finally {
        if (isMounted) {
          setShowGate(false);
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await syncUser(session.user);
      } else if (event === "SIGNED_OUT") {
        clearAuth();
      }

      if (isMounted) {
        setShowGate(false);
        setLoading(false);
      }
    });

    const failsafe = setTimeout(() => {
      if (isMounted) {
        setShowGate(false);
        setLoading(false);
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (showGate) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950">
        <div className="relative mb-6">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        </div>
        <p className="text-sm text-slate-400 font-medium animate-pulse">
          Autenticando VIP...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}