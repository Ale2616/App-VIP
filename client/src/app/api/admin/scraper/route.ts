import { NextRequest, NextResponse } from "next/server";
import gplay from "google-play-scraper";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { appId } = body;

    if (!appId || typeof appId !== "string") {
      return NextResponse.json(
        { error: "Se requiere un appId válido (ej. com.whatsapp)" },
        { status: 400 }
      );
    }

    const appData = await gplay.app({ appId: appId.trim(), lang: "es", country: "us" });

    return NextResponse.json({
      title: appData.title || "",
      description: appData.description || "",
      icon: appData.icon || "",
      screenshots: appData.screenshots || [],
    });
  } catch (err: any) {
    console.error("❌ Scraper error:", err);

    if (err?.message?.includes("not found") || err?.message?.includes("404")) {
      return NextResponse.json(
        { error: `No se encontró la app con ID: "${err?.appId || "desconocido"}". Verifica el ID.` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al buscar la app: " + (err?.message || "Error desconocido") },
      { status: 500 }
    );
  }
}
