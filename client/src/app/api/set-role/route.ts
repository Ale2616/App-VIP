import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wzeklbcmloxxvzqtxocq.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_Irc_VuEUm_TMrVfB9dgf3g_UxAyGRVG";

// Admin client using service role key (only for backend updates)
const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    
    // Create Supabase client with caller's cookies to verify identity
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verify caller role is SUPER_ADMIN
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Solo SUPER_ADMIN puede cambiar roles" }, { status: 403 });
    }

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId y role son requeridos" },
        { status: 400 }
      );
    }

    const validRoles = ["SUPER_ADMIN", "EDITOR", "VIP_PREMIUM", "VIP_ESTANDAR", "FREE_USER"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Rol inválido. Usa uno de: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // 1. Update profiles table
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (profileError) {
      console.error("❌ Error actualizando profiles:", profileError);
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    // 2. Sync raw_user_meta_data in Supabase Auth
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
