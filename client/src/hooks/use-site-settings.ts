import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface SiteSettings {
  id: number;
  logo_url: string | null;
}

/**
 * Hook to fetch site settings (logo_url) from the site_settings table.
 * Falls back gracefully if the table doesn't exist yet.
 */
export function useSiteSettings() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("logo_url")
          .eq("id", 1)
          .single();

        if (!error && data?.logo_url) {
          setLogoUrl(data.logo_url);
        }
      } catch {
        // Table might not exist yet — fail silently
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  return { logoUrl, loading };
}
