"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setProfile, clearAuth } = useAuthStore();

  useEffect(() => {
    const loadUserSilently = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          clearAuth();
          return;
        }

        // Busca tus datos reales (incluyendo el rol admin) en silencio
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          setProfile({
            ...profile,
            id: session.user.id,
            email: session.user.email || profile.email || "",
            role: profile.role || "user", // Trae tu admin si está en la BD
          });
        } else {
          // Si por algo falla el perfil, te mantiene la sesión básica
          setProfile({
            id: session.user.id,
            email: session.user.email || "",
            role: "user",
          } as any);
        }
      } catch (error) {
        console.error("Error validando sesión en segundo plano:", error);
        clearAuth();
      }
    };

    // Ejecuta la validación sin detener la página
    loadUserSilently();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserSilently();
      } else {
        clearAuth();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setProfile, clearAuth]);

  // LA REGLA DE ORO: La página SIEMPRE se muestra, sin barreras ni esperas.
  return <>{children}</>;
}