"use client";

import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";

export function useLogin() {
  const { setProfile } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      if (data.user) {
        // Fetch profile from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          setProfile(profile);
        }
      }
      router.push("/");
    },
  });
}

export function useRegister() {
  const { setProfile } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      name,
      email,
      password,
    }: {
      name: string;
      email: string;
      password: string;
    }) => {
      // 1. Registrar usuario en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }, // Se pasa como user_metadata para el trigger
        },
      });

      if (error) throw error;

      // 2. Verificar que la cuenta realmente se creó
      if (!data.user) {
        throw new Error("No se pudo crear la cuenta. Intenta de nuevo.");
      }

      // 3. Si Supabase devuelve identities vacías, el email ya existe
      if (data.user.identities && data.user.identities.length === 0) {
        throw new Error("Este correo electrónico ya está registrado. Intenta iniciar sesión.");
      }

      return data;
    },
    onSuccess: async (data) => {
      if (data.user) {
        // Esperar a que el trigger de la base de datos cree el perfil
        // Intentar hasta 3 veces con delays incrementales
        let profile = null;

        for (let attempt = 1; attempt <= 3; attempt++) {
          // Esperar antes de consultar (el trigger necesita tiempo)
          await new Promise((r) => setTimeout(r, attempt * 600));

          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user!.id)
            .single();

          if (profileData) {
            profile = profileData;
            break;
          }
        }

        if (profile) {
          setProfile(profile);
        }
      }
      router.push("/");
    },
  });
}
