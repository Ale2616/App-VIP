import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════════════
// sitemap.xml — Mapa del sitio dinámico para Google
// ═══════════════════════════════════════════════════════════
// Next.js genera este archivo automáticamente en /sitemap.xml
// Google lo usa para descubrir y indexar todas tus páginas.
//
// Se ejecuta en el servidor (build time / ISR), NO en el navegador.
// Por eso usamos @supabase/supabase-js directamente (no SSR client).

const SITE_URL = "https://appvip2026.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ─── Páginas estáticas ─────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // ─── Páginas dinámicas (apps del catálogo) ─────────────
  let appPages: MetadataRoute.Sitemap = [];

  try {
    // Crear cliente de Supabase para server-side
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wzeklbcmloxxvzqtxocq.supabase.co";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_Irc_VuEUm_TMrVfB9dgf3g_UxAyGRVG";

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: apps } = await supabase
      .from("applications")
      .select("id, updated_at, created_at")
      .order("created_at", { ascending: false });

    if (apps && apps.length > 0) {
      appPages = apps.map((app) => ({
        url: `${SITE_URL}/apps/${app.id}`,
        lastModified: new Date(app.updated_at || app.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }
  } catch (error) {
    // Si falla la conexión a Supabase, generar sitemap solo con páginas estáticas
    console.error("Error fetching apps for sitemap:", error);
  }

  return [...staticPages, ...appPages];
}
