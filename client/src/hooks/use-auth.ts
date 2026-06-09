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
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Tiempo de espera agotado. Por favor, verifica tu conexión de red.")), 12000)
      );

      const signInPromise = (async () => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;
          return data;
        } catch (err: any) {
          if (err instanceof TypeError && err.message?.toLowerCase().includes("fetch")) {
            throw new Error("Error de conexión. No se pudo contactar al servidor de Supabase.");
          }
          throw err;
        }
      })();

      return await Promise.race([signInPromise, timeoutPromise]);
    },
    onSuccess: async (data) => {
      if (data.user) {
        try {
          const profilePromise = (async () => {
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", data.user.id)
              .single();
            if (error) throw error;
            return profile;
          })();

          const profileTimeout = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), 5000)
          );

          const profile = await Promise.race([profilePromise, profileTimeout]);

          if (profile) {
            setProfile(profile);
          } else {
            setProfile({
              id: data.user.id,
              email: data.user.email || "",
              role: "user",
            } as any);
          }
        } catch (profileError) {
          console.error("Error al obtener perfil durante el inicio de sesión:", profileError);
          setProfile({
            id: data.user.id,
            email: data.user.email || "",
            role: "user",
          } as any);
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
          data: { name },
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
        // Esperar a que el trigger cree el perfil con reintentos
        let profile = null;

        for (let attempt = 1; attempt <= 3; attempt++) {
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
