import { createBrowserClient } from "@supabase/ssr";

// Credenciales hardcoded — temporal hasta resolver .env.local
const supabaseUrl = "https://wzeklbcmloxxvzqtxocq.supabase.co";
const supabaseAnonKey = "sb_publishable_Irc_VuEUm_TMrVfB9dgf3g_UxAyGRVG";

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
