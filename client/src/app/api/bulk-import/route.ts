import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import gplay from "google-play-scraper";

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wzeklbcmloxxvzqtxocq.supabase.co";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_publishable_Irc_VuEUm_TMrVfB9dgf3g_UxAyGRVG";

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn("⚠️ Advertencia: SUPABASE_SERVICE_ROLE_KEY no está configurada en .env. Se usará la Anon Key como fallback.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const body = await request.json().catch(() => ({}));
    const { appIds } = body;

    if (!appIds || !Array.isArray(appIds)) {
      return NextResponse.json(
        { error: "Se requiere un array de appIds" },
        { status: 400 }
      );
    }

    if (appIds.length > 25) {
      return NextResponse.json(
        { error: "El lote no puede superar los 25 appIds por petición" },
        { status: 400 }
      );
    }

    const importedApps: any[] = [];
    const errors: any[] = [];
    let duplicatedCount = 0;

    for (const appId of appIds) {
      try {
        const data: any = await gplay.app({ appId, lang: "es", country: "us" });

        // Deduplicación
        const { data: existing } = await supabaseAdmin
          .from("applications")
          .select("id")
          .ilike("name", `%${data.title}%`)
          .limit(1)
          .maybeSingle();

        if (existing) {
          console.log(`App duplicada, omitiendo: ${data.title}`);
          duplicatedCount++;
          continue;
        }

        // Categoría
        const genreId = String(data.genreId ?? "").toLowerCase();
        const isGame =
          genreId.includes("game") ||
          String(data.genre ?? "") === "Games" ||
          String(data.genre ?? "").toLowerCase().includes("action") ||
          String(data.genre ?? "").toLowerCase().includes("casual");
        const category = isGame ? "Juegos" : "Aplicaciones";

        // === NORMALIZACIÓN AGRESIVA A STRING ===
        const rawVersion = String(data.version ?? "Última Versión");
        const cleanVersion = rawVersion.toLowerCase().includes("vary") ? "Última Versión" : rawVersion;

        const rawSize = String(data.size ?? data.appSize ?? "Variable");
        const cleanSize = rawSize === "0.0 MB" || rawSize === "" || rawSize === "undefined" ? "Variable" : rawSize;

        const rawScore = data.score ?? data.scoreText ?? 0;
        const scoreNum = parseFloat(String(rawScore));
        const cleanScore = isNaN(scoreNum) ? "0.0" : scoreNum.toFixed(1);

        const rawInstalls = String(data.installs ?? "0");
        const cleanInstalls = rawInstalls === "undefined" || rawInstalls === "" ? "0" : rawInstalls;

        const appPayload = {
          name: String(data.title ?? "Sin título"),
          description: String(data.description ?? ""),
          version: String(cleanVersion),
          icon_url: String(data.icon ?? ""),
          image_url: String(data.headerImage ?? ""),
          screenshots: Array.isArray(data.screenshots) ? data.screenshots : [],
          download_url: "pending",
          file_size: String(cleanSize),
          category: String(category),
          is_premium: false,
          download_count: 0,
          score: String(cleanScore),
          installs: String(cleanInstalls),
        };

        const { error: insertError } = await supabaseAdmin
          .from("applications")
          .insert([appPayload]);

        if (insertError) {
          console.error(`Error insertando ${data.title}:`, insertError);
          errors.push({ appId, error: insertError.message });
        } else {
          importedApps.push(appPayload);
        }
      } catch (err: any) {
        console.error(`Error procesando appId ${appId}:`, err);
        errors.push({ appId, error: err?.message || "Error al obtener datos" });
      }
    }

    return NextResponse.json({
      success: true,
      importedCount: importedApps.length,
      duplicatedCount,
      failedCount: errors.length,
      errors,
    });
  } catch (err: any) {
    console.error("Error general en bulk-import:", err);
    return NextResponse.json(
      { error: err?.message || "Error del servidor" },
      { status: 500 }
    );
  }
}
