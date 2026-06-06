import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import gplay from "google-play-scraper";

function parseSizeToBytes(sizeStr?: string | null): number {
  if (!sizeStr) return 0;
  const cleanStr = sizeStr.replace(/,/g, "").trim().toLowerCase();
  const num = parseFloat(cleanStr);
  if (isNaN(num)) return 0;
  if (cleanStr.endsWith("gb") || cleanStr.endsWith("g")) {
    return Math.round(num * 1024 * 1024 * 1024);
  }
  if (cleanStr.endsWith("mb") || cleanStr.endsWith("m")) {
    return Math.round(num * 1024 * 1024);
  }
  if (cleanStr.endsWith("kb") || cleanStr.endsWith("k")) {
    return Math.round(num * 1024);
  }
  return Math.round(num);
}

export async function POST(request: Request) {
  try {
    // Inicialización segura de Supabase dentro del handler para capturar errores de configuración
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

    // Limitar tamaño de lote para evitar timeouts
    if (appIds.length > 25) {
      return NextResponse.json(
        { error: "El lote no puede superar los 25 appIds por petición" },
        { status: 400 }
      );
    }

    const importedApps = [];
    const errors = [];
    let duplicatedCount = 0;

    for (const appId of appIds) {
      try {
        // Extraer metadatos de Google Play Scraper
        const data = await gplay.app({ appId, lang: "es", country: "us" });

        // Lógica de Deduplicación: buscar si ya existe en la base de datos por nombre
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

        // Determinar categoría (Juegos vs Aplicaciones)
        const genreId = data.genreId ? data.genreId.toLowerCase() : "";
        const isGame =
          genreId.includes("game") ||
          data.genre === "Games" ||
          data.genre?.toLowerCase().includes("action") ||
          data.genre?.toLowerCase().includes("casual");
        const category = isGame ? "Juegos" : "Aplicaciones";

        // Normalización de datos
        const dataAny = data as any; // Usamos 'any' para evitar que TypeScript se bloquee
        const rawSize = dataAny.size || dataAny.appSize || "Variable";
        const rawVersion = dataAny.version || "Última Versión";

        // Ahora aplicamos la limpieza
        const cleanVersion = rawVersion.toLowerCase().includes('vary') ? 'Última Versión' : rawVersion;
        const cleanSize = rawSize === '0.0 MB' || rawSize === "" ? 'Variable' : rawSize;

        let cleanScore = "0.0";
        if (data.score !== undefined && data.score !== null) {
          const scoreNum = parseFloat(String(data.score));
          cleanScore = isNaN(scoreNum) ? "0.0" : scoreNum.toFixed(1);
        } else if (data.scoreText) {
          const scoreNum = parseFloat(data.scoreText);
          cleanScore = isNaN(scoreNum) ? "0.0" : scoreNum.toFixed(1);
        }

        const cleanInstallsText = (installsStr?: string | null): string => {
          if (!installsStr) return "0";
          const clean = installsStr.replace(/[, \+]/g, "").trim();
          const num = parseInt(clean, 10);
          if (isNaN(num)) {
            return installsStr.length > 15 ? installsStr.slice(0, 15) : installsStr;
          }
          if (num >= 1000000000) {
            return `${(num / 1000000000).toFixed(0)}B+`;
          }
          if (num >= 1000000) {
            return `${(num / 1000000).toFixed(0)}M+`;
          }
          if (num >= 1000) {
            return `${(num / 1000).toFixed(0)}k+`;
          }
          return installsStr;
        };
        const cleanInstalls = cleanInstallsText(data.installs);

        // Mapear al modelo de la base de datos con control de campos nulos
        const appPayload = {
          name: data.title || "Sin título",
          description: data.description || "",
          version: cleanVersion,
          icon_url: data.icon || null,
          image_url: data.headerImage || null,
          screenshots: Array.isArray(data.screenshots) ? data.screenshots : [],
          download_url: "pending", // Campo requerido por defecto
          file_size: cleanSize,
          category: category,
          is_premium: false,
          download_count: 0,
          score: cleanScore,
          installs: cleanInstalls,
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
