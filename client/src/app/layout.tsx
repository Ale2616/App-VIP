import type { Metadata } from "next"
import { Inter, Geist } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/auth-provider";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] })

// ═══════════════════════════════════════════════════════════
// SEO — Metadata completa para posicionamiento en Google
// ═══════════════════════════════════════════════════════════
const SITE_URL = "https://appvip2026.vercel.app";
const SITE_NAME = "App VIP";
const SITE_DESCRIPTION =
  "Descarga las mejores aplicaciones y juegos gratis en App VIP. Catálogo premium verificado con descargas directas, seguras y rápidas. ¡Miles de apps disponibles!";

export const metadata: Metadata = {
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

  // ─── Favicon ──────────────────────────────────────────
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },

  // ─── Categoría y clasificación ────────────────────────
  category: "Technology",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <head>
        {/* Verificación de Google Search Console — reemplaza XXXXXXXX con tu código */}
        {/* <meta name="google-site-verification" content="XXXXXXXX" /> */}
      </head>
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
