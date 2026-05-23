"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";

function enrichProfile(profile: Profile, authUser: User): Profile {
  return {
    ...profile,
    email: profile.email || authUser.email || "",
    created_at: profile.created_at || authUser.created_at || new Date().toISOString(),
  };
}

async function loadProfileFromDB(
  userId: string,
  authUser: User,
  setProfile: (p: Profile) => void,
  clearAuth: () => void
) {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.warn("Aviso: No se encontró perfil en la BD. Usando datos básicos.");
      // Si no hay perfil en la BD, creamos uno básico para NO romper la sesión
      setProfile(enrichProfile({ id: userId } as Profile, authUser));
      return;
    }

    if (profile) {
      setProfile(enrichProfile(profile, authUser));
    }
  } catch (error) {
    console.error("Error crítico cargando perfil:", error);
    // Ya no hacemos clearAuth() aquí para evitar el bucle infinito
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setProfile, clearAuth, setLoading } = useAuthStore();

  // 🛡️ ESCUDO LOCAL: Se controla a sí mismo y se destruye al abrirse
  const [showGate, setShowGate] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          await loadProfileFromDB(session.user.id, session.user, setProfile, clearAuth);
        } else {
          clearAuth();
        }
      } catch (error) {
        console.error("Error en initAuth:", error);
        clearAuth();
      } finally {
        if (isMounted) {
          setShowGate(false); // ¡DESTRUYE EL ESCUDO!
          setLoading(false);  // Por si acaso sincronizamos
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
          await loadProfileFromDB(session.user.id, session.user, setProfile, clearAuth);
        } else if (event === "SIGNED_OUT") {
          clearAuth();
        }
      } catch (error) {
        console.error("Error en auth event:", error);
      } finally {
        if (isMounted) {
          setShowGate(false);
          setLoading(false);
        }
      }
    });

    // 💣 SEGURO DE VIDA EXTREMO: Si en 2 segundos no ha cargado, se abre a la fuerza
    const failsafe = setTimeout(() => {
      if (isMounted) {
        setShowGate(false);
        setLoading(false);
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auth Gate: pantalla de carga temporal ──
  if (showGate) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black">
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