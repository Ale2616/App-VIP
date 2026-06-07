import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wzeklbcmloxxvzqtxocq.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_Irc_VuEUm_TMrVfB9dgf3g_UxAyGRVG";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // Paths that require SUPER_ADMIN or EDITOR role
  const isAdminPath = url.pathname.startsWith("/admin-panel") || url.pathname.startsWith("/admin");
  const isAdminApi = url.pathname.startsWith("/api/admin") || url.pathname.startsWith("/api/set-role");

  if (isAdminPath || isAdminApi) {
    if (!user) {
      if (isAdminApi) {
        return NextResponse.json({ error: "No autorizado (no autenticado)" }, { status: 401 });
      }
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // Fetch profile role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    if (!role || !["SUPER_ADMIN", "EDITOR"].includes(role)) {
      if (isAdminApi) {
        return NextResponse.json({ error: "No autorizado (permisos insuficientes)" }, { status: 403 });
      }
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin-panel/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/set-role/:path*",
  ],
};
