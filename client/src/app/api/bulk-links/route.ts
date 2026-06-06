import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to check if string is UUID
const isUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export async function POST(request: Request) {
  try {
    const { links } = await request.json();

    if (!links || !Array.isArray(links)) {
      return NextResponse.json(
        { error: "Se requiere un array de enlaces" },
        { status: 400 }
      );
    }

    let updatedCount = 0;
    const errors = [];

    // Bucle secuencial para actualizar cada enlace de forma segura
    for (const item of links) {
      const { appId, downloadUrl } = item;

      if (!appId || !downloadUrl) {
        errors.push({ item, error: "Faltan campos requeridos (appId o downloadUrl)" });
        continue;
      }

      try {
        let query;

        if (isUUID(appId)) {
          // Si es UUID, buscar coincidencia por ID
          query = supabaseAdmin
            .from("applications")
            .update({ download_url: downloadUrl, updated_at: new Date().toISOString() })
            .eq("id", appId);
        } else {
          // Si no es UUID, buscar coincidencia exacta por Nombre (Funda de verdad del scraper o nombre legible)
          query = supabaseAdmin
            .from("applications")
            .update({ download_url: downloadUrl, updated_at: new Date().toISOString() })
            .eq("name", appId);
        }

        const { error, data, count } = await query.select();

        if (error) {
          console.error(`Error actualizando app ${appId}:`, error);
          errors.push({ appId, error: error.message });
        } else if (data && data.length > 0) {
          updatedCount += data.length;
        } else {
          errors.push({ appId, error: "No se encontró ninguna aplicación con ese ID o Nombre" });
        }
      } catch (err: any) {
        console.error(`Error en bloque para app ${appId}:`, err);
        errors.push({ appId, error: err?.message || "Error desconocido" });
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      failedCount: errors.length,
      errors,
    });
  } catch (err: any) {
    console.error("Error general en bulk-links:", err);
    return NextResponse.json(
      { error: err?.message || "Error del servidor" },
      { status: 500 }
    );
  }
}
