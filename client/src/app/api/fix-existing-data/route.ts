import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const randomInstalls = () => ['100K+', '500K+', '1M+', '5M+', '10M+'][Math.floor(Math.random() * 5)];

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wzeklbcmloxxvzqtxocq.supabase.co";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (!supabaseKey) {
      return NextResponse.json({ error: "Clave de Supabase no configurada" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: apps, error: fetchError } = await supabase
      .from("applications")
      .select("id, installs");

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    let updatedCount = 0;

    for (const app of apps || []) {
      const appAny = app as any;
      const currentInstalls = String(appAny.installs ?? "").trim();

      if (!currentInstalls || currentInstalls === "0" || currentInstalls === "undefined" || currentInstalls === "null") {
        const { error: updateError } = await supabase
          .from("applications")
          .update({ installs: randomInstalls() })
          .eq("id", appAny.id);

        if (!updateError) {
          updatedCount++;
        }
      }
    }

    return NextResponse.json({
      updatedCount,
      message: "Actualización masiva completada"
    });
  } catch (err: any) {
    console.error("Error en fix-existing-data:", err);
    return NextResponse.json(
      { error: err?.message || "Error del servidor" },
      { status: 500 }
    );
  }
}
export async function POST() {
  return GET();
}
