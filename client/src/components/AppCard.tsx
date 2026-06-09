"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, AppWindow, Download } from "lucide-react";
import type { App } from "@/types";

/* ─────────────────────────────────────────────────────────
   Badge de categoría — color dinámico según el nombre
   ───────────────────────────────────────────────────────── */
const categoryColors: Record<string, string> = {
  "Juegos":      "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  "Juegos PC":   "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400",
  "Aplicaciones": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  "Software PC": "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400",
};

function getCategoryBadgeClass(category: string): string {
  return categoryColors[category] ?? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
}

function formatInstalls(raw?: string | null): string {
  if (!raw || raw === "0") return "";

  const lower = raw.trim().toLowerCase();
  
  if (lower.endsWith("k+") || lower.endsWith("m+") || lower.endsWith("b+")) {
    return raw.toUpperCase();
  }
  
  if (lower.endsWith("k") || lower.endsWith("m") || lower.endsWith("b")) {
    return `${raw.slice(0, -1).trim()}${lower.slice(-1).toUpperCase()}+`;
  }

  const cleanDigits = lower.replace(/[^0-9]/g, "");
  const num = parseInt(cleanDigits, 10);
  if (isNaN(num)) return raw;

  if (num >= 1_000_000_000) {
    const val = num / 1_000_000_000;
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1).replace(".", ",")}${"B+"}`;
  }
  if (num >= 1_000_000) {
    const val = num / 1_000_000;
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1).replace(".", ",")}${"M+"}`;
  }
  if (num >= 1_000) {
    const val = num / 1_000;
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1).replace(".", ",")}${"K+"}`;
  }
  return String(num);
}

/* ─────────────────────────────────────────────────────────
   AppCard — tarjeta premium para el catálogo
   ───────────────────────────────────────────────────────── */
export default function AppCard({ app }: { app: App }) {
  const isMod =
    app.mod ||
    app.name.toLowerCase().includes("mod") ||
    app.description.toLowerCase().includes("mod");

  const initialSrc = app.icon_url || app.image_url || null;
  const [imgSrc, setImgSrc] = useState<string | null>(initialSrc);
  const [hasError, setHasError] = useState(!initialSrc);

  return (
    <Link href={`/apps/${app.id}`} className="block group">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-200/60 dark:border-slate-700/50 transition-all duration-300 overflow-hidden h-full flex flex-col">
        {/* ── Icono ── */}
        <div className="p-4 pb-2 flex justify-center">
          <div className="relative w-20 h-20 sm:w-[88px] sm:h-[88px]">
            {!hasError && imgSrc ? (
              <img
                src={imgSrc}
                alt={app.name}
                referrerPolicy="no-referrer"
                onError={() => setHasError(true)}
                className="w-full h-full max-w-full h-auto aspect-square object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full aspect-square rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center shadow-md">
                <AppWindow className="w-9 h-9 text-gray-400 dark:text-slate-500" />
              </div>
            )}
          </div>
        </div>

        {/* ── Contenido ── */}
        <div className="px-3 pb-3 pt-1 flex flex-col flex-1 items-center text-center gap-1.5 font-bold">
          {/* Título — 1 línea, truncado */}
          <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate w-full leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {app.name}
          </h3>

          {/* Versión */}
          {app.version && (
            <span className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">
              v{app.version}
            </span>
          )}

          {/* Etiquetas (Categoría, MOD, VIP) */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {/* Badge de categoría real */}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${getCategoryBadgeClass(app.category)}`}>
              {app.category}
            </span>

            {/* Badge MOD */}
            {isMod && (
              <span className="inline-flex items-center w-auto px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 text-center text-xs sm:text-sm">
                {typeof isMod === "string" ? isMod : "MOD"}
              </span>
            )}

            {/* Badge VIP */}
            {app.is_premium && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                <Crown className="w-2.5 h-2.5" />VIP
              </span>
            )}
          </div>

          {/* Fila de Métricas */}
          <div className="flex flex-row justify-between items-center w-full mt-auto pt-2 border-t border-gray-100 dark:border-slate-700/50">
            {/* Calificación */}
            <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 gap-0.5">
              <span>⭐</span>
              <span>{app.score && app.score !== "0" && app.score !== "0.0" ? app.score : "4.5"}</span>
            </div>

            {/* Descargas */}
            <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-50 text-gray-700 dark:bg-slate-700/50 dark:text-slate-300 border border-gray-200/50 dark:border-slate-600/30 gap-1">
              <Download className="w-3 h-3 text-gray-500 dark:text-slate-400" />
              <span>{formatInstalls(app.installs) || formatInstalls(String(app.download_count ?? 0)) || "10K+"}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────
   AppCardSkeleton — placeholder de carga
   ───────────────────────────────────────────────────────── */
export function AppCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/60 dark:border-slate-700/50 overflow-hidden animate-pulse">
      <div className="p-4 pb-2 flex justify-center">
        <div className="w-20 h-20 sm:w-[88px] sm:h-[88px] rounded-xl bg-gray-200 dark:bg-slate-700" />
      </div>
      <div className="px-3 pb-3 pt-1 flex flex-col items-center gap-2">
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-1/2 bg-gray-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  );
}
