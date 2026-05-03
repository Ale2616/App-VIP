import type { MetadataRoute } from "next";

// ═══════════════════════════════════════════════════════════
// robots.txt — Controla qué páginas puede indexar Google
// ═══════════════════════════════════════════════════════════
// Next.js genera este archivo automáticamente en /robots.txt

export default function robots(): MetadataRoute.Robots {
  const siteUrl = "https://appvip2026.vercel.app";

  return {
    rules: [
      {
        // Permitir a todos los bots indexar el sitio
        userAgent: "*",
        allow: "/",
        // Bloquear páginas de administración
        disallow: ["/admin-panel", "/admin", "/upload"],
      },
    ],
    // Indicar dónde está el sitemap
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
