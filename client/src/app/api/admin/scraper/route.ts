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

    let targetAppId = appId.trim();
    if (targetAppId.includes("play.google.com")) {
      try {
        const url = new URL(targetAppId);
        const idParam = url.searchParams.get("id");
        if (idParam) {
          targetAppId = idParam.trim();
        }
      } catch (e) {
        // Fallback
      }
    }

    const isPackageName = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/i.test(targetAppId);
    if (!isPackageName) {
      try {
        const searchResults = await gplay.search({ term: targetAppId, num: 1, lang: "es", country: "us" });
        if (searchResults && searchResults.length > 0) {
          targetAppId = searchResults[0].appId;
        } else {
          return NextResponse.json(
            { error: `No se encontró ningún resultado en Play Store para la búsqueda: "${targetAppId}"` },
            { status: 404 }
          );
        }
      } catch (searchErr: any) {
        console.error("🔍 Play Store Search error:", searchErr);
        return NextResponse.json(
          { error: `Error buscando "${targetAppId}" en Play Store: ${searchErr.message || searchErr}` },
          { status: 500 }
        );
      }
    }

    const appData = await gplay.app({ appId: targetAppId, lang: "es", country: "us" });

    let reviews: any[] = [];
    try {
      const reviewsData = await gplay.reviews({
        appId: appId.trim(),
        lang: "es",
        country: "us",
        num: 5,
      });
      const list = Array.isArray(reviewsData) ? reviewsData : (reviewsData.data || []);
      reviews = list.map((r: any) => ({
        name: r.userName || "Usuario Anónimo",
        score: r.score || 5,
        comment: r.text || "",
        date: r.date ? new Date(r.date).toLocaleDateString("es-ES") : new Date().toLocaleDateString("es-ES"),
      }));
    } catch (revErr) {
      console.error("⚠️ Failed to scrape reviews:", revErr);
    }

    return NextResponse.json({
      title: appData.title || "",
      description: appData.description || "",
      icon: appData.icon || "",
      screenshots: appData.screenshots || [],
      contentRating: appData.contentRating || "",
      score: appData.score || null,
      installs: appData.installs || null,
      histogram: appData.histogram || null,
      reviews: reviews.length > 0 ? reviews : null,
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
