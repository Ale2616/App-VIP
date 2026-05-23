import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Analytics } from "@vercel/analytics/react";
import { Footer } from "@/components/Footer";
import { Send } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const inter = Inter({ subsets: ["latin"] });

// ═══════════════════════════════════════════════════════════
// SEO — Metadata completa para posicionamiento en Google
// ═══════════════════════════════════════════════════════════
const SITE_URL = "https://appvip2026.vercel.app";
const SITE_NAME = "App VIP";
const SITE_DESCRIPTION =
  "Descarga las mejores aplicaciones y juegos gratis en App VIP. Catálogo premium verificado con descargas directas, seguras y rápidas. ¡Miles de apps disponibles!";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata(): Promise<Metadata> {
  // URL de respaldo obligatoria — logo oficial de App VIP en Supabase Storage
  const FALLBACK_LOGO =
    "https://wzeklbcmloxxvzqtxocq.supabase.co/storage/v1/object/public/app-images/logo-appvip.png";

  // Obtener logo dinámico de site_settings
  let logoUrl: string | null = null;
  try {
    const { data } = await supabaseServer
      .from("site_settings")
      .select("logo_url")
      .eq("id", 1)
      .single();
    if (data?.logo_url) logoUrl = data.logo_url;
  } catch {
    // Si falla, se usa FALLBACK_LOGO
  }

  const faviconUrl = logoUrl || FALLBACK_LOGO;

  return {
    // ─── Títulos ────────────────────────────────────────────
    title: {
      default: "App VIP — Descargar Aplicaciones y Juegos Gratis 2026",
      template: "%s | App VIP",
    },
    description: SITE_DESCRIPTION,

    // ─── Keywords ───────────────────────────────────────────
    keywords: [
      "descargar aplicaciones",
      "descargar apps gratis",
      "descargar juegos gratis",
      "catálogo de aplicaciones",
      "apps premium",
      "juegos android",
      "aplicaciones android",
      "descargar APK",
      "app store alternativa",
      "apps verificadas",
      "descargas seguras",
      "App VIP",
      "tienda de apps",
      "mejores aplicaciones 2026",
      "juegos móviles gratis",
    ],

    // ─── Autor y creador ───────────────────────────────────
    authors: [{ name: "App VIP Team" }],
    creator: "App VIP",
    publisher: "App VIP",

    // ─── Robots / Indexación ───────────────────────────────
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    // ─── Open Graph (Facebook, WhatsApp, Telegram, etc.) ──
    openGraph: {
      type: "website",
      locale: "es_ES",
      url: SITE_URL,
      siteName: SITE_NAME,
      title: "App VIP — Descargar Aplicaciones y Juegos Gratis",
      description: SITE_DESCRIPTION,
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: "App VIP — Catálogo de Aplicaciones y Juegos",
          type: "image/png",
        },
      ],
    },

    // ─── Twitter Card ──────────────────────────────────────
    twitter: {
      card: "summary_large_image",
      title: "App VIP — Descargar Aplicaciones y Juegos Gratis",
      description: SITE_DESCRIPTION,
      images: [`${SITE_URL}/og-image.png`],
      creator: "@appvip",
    },

    // ─── Otros meta tags ──────────────────────────────────
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: SITE_URL,
    },

    // ─── Favicon dinámico (sincronizado con logo del Panel Pro) ──
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl,
    },

    // ─── Categoría y clasificación ────────────────────────
    category: "Technology",

    // ─── Verificación Google Search Console ────────────────
    verification: {
      google: "n1zBtL_y2eOufZ6TcamlXcltJ2kIxUdtJ72N7ATlK8w",
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.className} overflow-x-hidden`}>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Footer />
          </AuthProvider>
        </QueryProvider>

        {/* ── Botón flotante Telegram ── */}
        <a
          href="https://t.me/AppVIP26"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Únete a nuestra comunidad de Telegram"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#229ED9] shadow-[0_8px_30px_rgba(34,158,217,0.45)] transition-transform duration-200 hover:scale-110 hover:shadow-[0_8px_40px_rgba(34,158,217,0.65)] active:scale-95"
        >
          <Send className="h-6 w-6 text-white" strokeWidth={2} />
        </a>

        <Analytics />
      </body>
    </html>
  );
}
