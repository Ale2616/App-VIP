"use client";

import Link from "next/link";
import { Crown, Download, AppWindow, Star } from "lucide-react";
import type { App } from "@/types";

/* ─────────────────────────────────────────────────────────
   Badge de categoría — color dinámico según el nombre
   ───────────────────────────────────────────────────────── */
const categoryColors: Record<string, string> = {
  "Juegos":      "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  "Juegos PC":   "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400",
  "Aplicaciones":"bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  "Software PC": "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400",
};

function getCategoryBadgeClass(category: string): string {
  return categoryColors[category] ?? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
}

/* ─────────────────────────────────────────────────────────
   formatInstalls — formato compacto estilo Play Store
   ───────────────────────────────────────────────────────── */
function formatInstalls(raw?: string | null): string {
  if (!raw || raw === "0") return "";

  // Limpiar: quitar comas, puntos de miles, espacios, signos +
  const cleaned = raw.replace(/[,.\s+]+/g, "");
  const num = parseInt(cleaned, 10);

  // Si ya viene formateado (ej: "10M+"), devolver tal cual
  if (isNaN(num)) return raw;

  if (num >= 1_000_000_000) {
    const val = num / 1_000_000_000;
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}B+`;
  }
  if (num >= 1_000_000) {
    const val = num / 1_000_000;
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M+`;
  }
  if (num >= 1_000) {
    const val = num / 1_000;
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}K+`;
  }
  return String(num);
}

/* ─────────────────────────────────────────────────────────
   AppCard — tarjeta premium para el catálogo
   ───────────────────────────────────────────────────────── */
export default function AppCard({ app }: { app: App }) {
  const isMod =
    app.name.toLowerCase().includes("mod") ||
    app.description.toLowerCase().includes("mod");

  const imgSrc = app.icon_url || app.image_url;

  return (
    <Link href={`/apps/${app.id}`} className="block group">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-200/60 dark:border-slate-700/50 transition-all duration-300 overflow-hidden h-full flex flex-col">
        {/* ── Icono ── */}
        <div className="p-4 pb-2 flex justify-center">
          <div className="relative w-20 h-20 sm:w-[88px] sm:h-[88px]">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={app.name}
                referrerPolicy="no-referrer"
                className="w-full h-full aspect-square object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full aspect-square rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center shadow-md">
                <AppWindow className="w-9 h-9 text-gray-400 dark:text-slate-500" />
              </div>
            )}
          </div>
        </div>

        {/* ── Contenido ── */}
        <div className="px-3 pb-3 pt-1 flex flex-col flex-1 items-center text-center gap-1.5">
          {/* Título — 1 línea, truncado */}
          <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate w-full leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {app.name}
          </h3>
                   {/* Fila de Datos Técnicos (Estilo adescargar.net) */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] mt-1 w-full flex-wrap">
            {app.score && app.score !== "0" && app.score !== "0.0" && (
              <div className="flex items-center gap-0.5 px-1 rounded bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/25">
                <Star className="w-3 h-3.5 fill-amber-400 text-amber-400" />
                <span className={`font-bold ${parseFloat(app.score) > 4.0 ? "text-amber-500 dark:text-amber-400" : "text-gray-400 dark:text-slate-500"}`}>
                  {app.score}
                </span>
              </div>
            )}
            
            {formatInstalls(app.installs) && (
              <span className="text-gray-500 dark:text-slate-400 font-medium px-1 bg-gray-50 dark:bg-slate-800/80 rounded border border-gray-100 dark:border-slate-700/60">
                {formatInstalls(app.installs)} descargas
              </span>
            )}

            {app.version && (
              <span className="text-gray-500 dark:text-slate-400 font-medium px-1 bg-gray-50 dark:bg-slate-800/80 rounded border border-gray-100 dark:border-slate-700/60 font-medium">
                v{app.version}
              </span>
            )}
          </div>

          {/* Badges dinámicos */}
          <div className="flex flex-wrap items-center justify-center gap-1 mt-auto pt-1">
            {/* Badge de categoría real */}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${getCategoryBadgeClass(app.category)}`}>
              {app.category}
            </span>

            {/* Badge MOD */}
            {isMod && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                MOD
              </span>
            )}

            {/* Badge VIP */}
            {app.is_premium && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                <Crown className="w-2.5 h-2.5" />VIP
              </span>
            )}
          </div>

          {/* Contador de descargas */}
          <span className="text-[10px] text-gray-400 dark:text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
            <Download className="w-3 h-3" />
            {formatInstalls(String(app.download_count ?? 0)) || "0"}
          </span>
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
