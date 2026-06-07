import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const isUUID = (str: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wzeklbcmloxxvzqtxocq.supabase.co";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (!supabaseKey) {
      return NextResponse.json({ error: "Clave de Supabase no configurada" }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const body = await request.json().catch(() => ({}));
    const { appIds } = body;

    if (!appIds || !Array.isArray(appIds)) {
      return NextResponse.json(
        { error: "Se requiere un array de identificadores (IDs o Nombres)" },
        { status: 400 }
      );
    }

    // Limpiar: dividir por saltos de línea y comas, trim, quitar vacíos
    const listaLimpia = appIds
      .flatMap((entry: string) => entry.split(/[\n,]+/))
      .map((id: string) => id.trim())
      .filter((id: string) => id.length > 0);

    console.log("IDs procesados para eliminar:", listaLimpia);

    if (listaLimpia.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron identificadores válidos después de limpiar la entrada" },
        { status: 400 }
      );
    }

    // Separar UUIDs de nombres/app_ids textuales
    const uuids = listaLimpia.filter((id: string) => isUUID(id));
    const textIds = listaLimpia.filter((id: string) => !isUUID(id));

    let totalDeleted = 0;
    const errors: any[] = [];

    // 1. Borrado por UUID (columna "id" de la base de datos)
    if (uuids.length > 0) {
      const { data, error } = await supabaseAdmin
        .from("applications")
        .delete()
        .in("id", uuids)
        .select();

      if (error) {
        console.error("Error al eliminar por UUIDs:", error);
        errors.push({ type: "uuid", error: error.message });
      } else if (data) {
        totalDeleted += data.length;
        console.log(`Eliminados ${data.length} por UUID`);
      }
    }

    // 2. Para los textuales: intentar primero por nombre exacto
    if (textIds.length > 0) {
      const { data: byName, error: nameError } = await supabaseAdmin
        .from("applications")
        .delete()
        .in("name", textIds)
        .select();

      if (nameError) {
        console.error("Error al eliminar por Nombres:", nameError);
        errors.push({ type: "name", error: nameError.message });
      } else if (byName && byName.length > 0) {
        totalDeleted += byName.length;
        console.log(`Eliminados ${byName.length} por nombre exacto`);
      }

      // 3. Los que no se encontraron por nombre, buscar con ilike (parcial)
      const namesFound = byName?.map((app: any) => app.name) || [];
      const notFound = textIds.filter((t: string) => !namesFound.includes(t));

      if (notFound.length > 0) {
        for (const term of notFound) {
          const { data: byLike, error: likeError } = await supabaseAdmin
            .from("applications")
            .delete()
            .ilike("name", `%${term}%`)
            .select();

          if (likeError) {
            console.error(`Error al eliminar por ilike "${term}":`, likeError);
            errors.push({ type: "ilike", term, error: likeError.message });
          } else if (byLike && byLike.length > 0) {
            totalDeleted += byLike.length;
            console.log(`Eliminados ${byLike.length} por búsqueda parcial "${term}"`);
          } else {
            console.log(`No se encontró coincidencia para: "${term}"`);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: totalDeleted,
      errors: errors.length > 0 ? errors : null,
    });
  } catch (err: any) {
    console.error("Error general en bulk-delete:", err);
    return NextResponse.json(
      { error: err?.message || "Error del servidor" },
      { status: 500 }
    );
  }
}
