import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const isUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export async function POST(request: Request) {
  try {
    const { appIds } = await request.json();

    if (!appIds || !Array.isArray(appIds)) {
      return NextResponse.json(
        { error: "Se requiere un array de identificadores (IDs o Nombres)" },
        { status: 400 }
      );
    }

    const uuids = appIds.map((id) => id.trim()).filter((id) => isUUID(id));
    const names = appIds.map((id) => id.trim()).filter((id) => id.length > 0 && !isUUID(id));

    let totalDeleted = 0;
    const errors = [];

    // Borrado por UUID (ID de base de datos)
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
      }
    }

    // Borrado por Nombre exacto
    if (names.length > 0) {
      const { data, error } = await supabaseAdmin
        .from("applications")
        .delete()
        .in("name", names)
        .select();

      if (error) {
        console.error("Error al eliminar por Nombres:", error);
        errors.push({ type: "name", error: error.message });
      } else if (data) {
        totalDeleted += data.length;
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
