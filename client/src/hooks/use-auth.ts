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
      console.log("🔑 [USE-AUTH] mutationFn ejecutándose con:", { name, email });

      // 1. Registrar usuario en Supabase Auth
      console.log("🔑 [USE-AUTH] Llamando a supabase.auth.signUp...");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      console.log("🔑 [USE-AUTH] Respuesta de signUp:", { data, error });

      if (error) {
        console.error("🔑 [USE-AUTH] Error de Supabase:", error.message, error.status);
        throw error;
      }

      // 2. Verificar que la cuenta realmente se creó
      if (!data.user) {
        console.error("🔑 [USE-AUTH] data.user es null!");
        throw new Error("No se pudo crear la cuenta. Intenta de nuevo.");
      }

      // 3. Si Supabase devuelve identities vacías, el email ya existe
      if (data.user.identities && data.user.identities.length === 0) {
        console.warn("🔑 [USE-AUTH] Email ya registrado (identities vacías)");
        throw new Error("Este correo electrónico ya está registrado. Intenta iniciar sesión.");
      }

      console.log("🔑 [USE-AUTH] Usuario creado con ID:", data.user.id);
      return data;
    },
    onSuccess: async (data) => {
      console.log("✅ [USE-AUTH] onSuccess disparado");
      if (data.user) {
        let profile = null;

        for (let attempt = 1; attempt <= 3; attempt++) {
          console.log(`🔄 [USE-AUTH] Intentando obtener perfil (intento ${attempt}/3)...`);
          await new Promise((r) => setTimeout(r, attempt * 600));

          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user!.id)
            .single();

          console.log(`🔄 [USE-AUTH] Resultado intento ${attempt}:`, { profileData, profileError });

          if (profileData) {
            profile = profileData;
            break;
          }
        }

        if (profile) {
          console.log("✅ [USE-AUTH] Perfil obtenido, guardando en store:", profile);
          setProfile(profile);
        } else {
          console.warn("⚠️ [USE-AUTH] No se pudo obtener perfil después de 3 intentos");
        }
      }
      console.log("🔄 [USE-AUTH] Redirigiendo a /");
      router.push("/");
    },
    onError: (error) => {
      console.error("❌ [USE-AUTH] onError disparado:", error);
    },
  });
}
