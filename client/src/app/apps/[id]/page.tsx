import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import AppDetailClient from "./client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const { data: app } = await supabase
    .from("applications")
    .select("name, description, icon_url, image_url")
    .eq("id", id)
    .single();

  const title = `${app?.name || "Aplicación"} Mod APK - Descargar Gratis | App VIP`;
  const description =
    app?.description ||
    "Descarga las mejores aplicaciones y juegos modificados en formato APK Premium.";
  const image = app?.icon_url || app?.image_url || undefined;

  return {
    title,
    description,
    openGraph: {
      title: `${app?.name || "App"} Premium APK`,
      description: `Descargar ${app?.name || "aplicación"} totalmente desbloqueado.`,
      url: `https://appvip2026.vercel.app/apps/${id}`,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function Page() {
  return <AppDetailClient />;
}
