import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wzeklbcmloxxvzqtxocq.supabase.co";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (!supabaseKey) {
      return NextResponse.json({ error: "Clave de Supabase no configurada" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await request.json().catch(() => ({}));
    const { appIds } = body;

    if (!appIds || !Array.isArray(appIds)) {
      return NextResponse.json(
        { error: "Se requiere un array de identificadores" },
        { status: 400 }
      );
    }

    const listaLimpia = appIds
      .map((id: any) => String(id ?? "").trim())
      .filter((id: string) => id.length > 0);

    let totalDeleted = 0;

    if (listaLimpia.length > 0) {
      const formattedIds = listaLimpia.map(id => `"${id}"`).join(",");
      const orFilter = `id.in.(${formattedIds}),name.in.(${formattedIds})`;

      const { data, error } = await supabase
        .from("applications")
        .delete()
        .or(orFilter)
        .select();

      if (error) {
        console.error("Error al eliminar aplicaciones:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (data) {
        totalDeleted = data.length;
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: totalDeleted,
    });
  } catch (err: any) {
    console.error("Error en bulk-delete:", err);
    return NextResponse.json(
      { error: err?.message || "Error del servidor" },
      { status: 500 }
    );
  }
}
