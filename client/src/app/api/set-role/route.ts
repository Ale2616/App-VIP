import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente de ADMINISTRACIÓN — usa la Service Role Key (solo en servidor)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId y role son requeridos" },
        { status: 400 }
      );
    }

    if (!["admin", "user"].includes(role)) {
      return NextResponse.json(
        { error: "Rol inválido. Usa 'admin' o 'user'" },
        { status: 400 }
      );
    }

    // 1. Actualizar tabla profiles (fuente de verdad principal)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (profileError) {
      console.error("❌ Error actualizando profiles:", profileError);
      return NextResponse.json(
        {
          error: profileError.message,
          code: profileError.code,
          details: profileError.details,
        },
        { status: 500 }
      );
    }

    // 2. Sincronizar raw_user_meta_data en Supabase Auth
    const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: { role } }
    );

    if (metaError) {
      console.error("❌ Error actualizando user_metadata:", metaError);
      return NextResponse.json(
        { error: metaError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, userId, role });
  } catch (err: any) {
    console.error("❌ Error en /api/set-role:", err);
    return NextResponse.json(
      { error: err?.message || "Error desconocido" },
      { status: 500 }
    );
  }
}
