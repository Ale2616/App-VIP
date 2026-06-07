"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("applications")
          .select("id, name, category, icon_url, image_url")
          .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
          .limit(6);

        if (!error && data) {
          setResults(data);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSelect = (appId: string) => {
    setQuery("");
    setIsOpen(false);
    router.push(`/apps/${appId}`);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs sm:max-w-sm">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar aplicación o juego..."
          className="w-full h-9 pl-9 pr-8 rounded-xl bg-gray-150/60 dark:bg-slate-800/80 border border-gray-200/40 dark:border-slate-700/60 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-all"
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
        />
        <Search className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 absolute left-3 pointer-events-none" />
        {loading && (
          <Loader2 className="w-3.5 h-3.5 text-gray-450 dark:text-slate-500 animate-spin absolute right-3" />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-gray-250/50 dark:border-slate-800/80 rounded-2xl shadow-xl z-50 overflow-hidden transition-all duration-200 ease-in-out">
          <div className="p-2 max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800/60 scrollbar-thin">
            {results.length > 0 ? (
              results.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleSelect(app.id)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-800/40 text-left rounded-xl transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-slate-800">
                    {app.icon_url || app.image_url ? (
                      <img
                        src={app.icon_url || app.image_url}
                        alt={app.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">
                        VIP
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {app.name}
                    </p>
                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      {app.category}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-gray-500 dark:text-slate-400">
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
