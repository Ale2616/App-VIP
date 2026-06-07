"use client";

import { useState } from "react";
import { useApps } from "@/hooks/use-apps";
import { useSiteSettings } from "@/hooks/use-site-settings";
import Header from "@/components/Header";
import AppCard, { AppCardSkeleton } from "@/components/AppCard";
import {
  Sparkles,
  TrendingUp,
  Clock,
  Gamepad2,
  AppWindow,
  Search,
  ArrowRight,
  Crown,
  Flame,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Sincronizamos todo el catálogo localmente para evitar discrepancias de mayúsculas/minúsculas o plurales en la base de datos
  const { data, isLoading } = useApps(undefined, false);
  const { logoUrl } = useSiteSettings();

  const allApps = data?.apps || [];

  // Función flexible y normalizada para comprobar la categoría
  const matchesCategory = (appCategory: string, isPremiumApp?: boolean, targetCat?: string) => {
    const appCat = (appCategory || "").toLowerCase().trim();
    const activeCat = (targetCat || "").toLowerCase().trim();

    if (activeCat === "all" || activeCat === "todos" || !activeCat) {
      return true;
    }
    if (activeCat === "vip") {
      return isPremiumApp === true || appCat.includes("vip");
    }
    if (activeCat === "juegos" || activeCat === "juego" || activeCat === "game") {
      return ["juego", "juegos", "game"].includes(appCat);
    }
    if (activeCat === "aplicaciones" || activeCat === "apps" || activeCat === "app") {
      return ["app", "apps", "aplicación", "aplicacion", "aplicaciones"].includes(appCat);
    }
    if (activeCat === "juegos pc" || activeCat === "pc") {
      return (
        appCat === "juego pc" ||
        appCat === "juegos pc" ||
        (appCat.includes("juego") && appCat.includes("pc"))
      ) && !appCat.includes("software");
    }
    if (activeCat === "software pc" || activeCat === "software") {
      return (
        appCat.includes("software") ||
        appCat.includes("programas")
      );
    }
    
    // Fallback a coincidencia exacta normalizada
    return appCat === activeCat;
  };

  // 1. Filtrar por búsqueda y por categoría activa
  let filteredApps = allApps.filter((app) => {
    const categoryMatch = matchesCategory(app.category, app.is_premium, activeCategory);
    
    let searchMatch = true;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      searchMatch =
        app.name.toLowerCase().includes(searchLower) ||
        app.description.toLowerCase().includes(searchLower);
    }
    
    return categoryMatch && searchMatch;
  });

  // ── Filtrados en memoria para los estantes (Secciones) ──
  
  // Destacados (Hero): Top 4 más populares (por descargas)
  const featuredApps = [...allApps]
    .sort((a, b) => (b.download_count ?? 0) - (a.download_count ?? 0))
    .slice(0, 4);

  // Tendencias (Lo más visto hoy): Top 6 con más visitas
  const trendingApps = [...allApps]
    .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
    .slice(0, 6);

  // Actualizaciones Recientes: Ordenados por fecha de creación desc (más recientes primero)
  const recentApps = [...allApps]
    .sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    )
    .slice(0, 8);

  // Más Populares / Recomendados: Siguiente lote de más populares
  const popularApps = [...allApps]
    .sort((a, b) => (b.download_count ?? 0) - (a.download_count ?? 0))
    .slice(4, 12);

  // Juegos Populares: Juegos de Android o PC
  const popularGames = allApps
    .filter((app) => {
      const appCat = (app.category || "").toLowerCase().trim();
      return ["juego", "juegos", "game", "juegos pc"].includes(appCat);
    })
    .sort((a, b) => (b.download_count ?? 0) - (a.download_count ?? 0))
    .slice(0, 8);

  // Apps Populares: Aplicaciones o Software
  const popularSoftwares = allApps
    .filter((app) => {
      const appCat = (app.category || "").toLowerCase().trim();
      return ["app", "apps", "aplicación", "aplicacion", "aplicaciones", "pc", "software", "software pc"].includes(appCat);
    })
    .sort((a, b) => (b.download_count ?? 0) - (a.download_count ?? 0))
    .slice(0, 8);

  // Determinar si debemos mostrar la vista normal filtrada o el dashboard temático
  const showDashboard = activeCategory === "all" && !searchTerm;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* ── Header responsivo ── */}
      <Header
        currentCategory={activeCategory}
        setCategory={setActiveCategory}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <main className="flex-1 container mx-auto px-4 py-8 space-y-12">
        {isLoading ? (
          /* Estado de Carga */
          <div className="space-y-8">
            <div className="h-6 w-48 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <AppCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : showDashboard ? (
          /* ════════════════════════════════════════════════════════════
             VISTA 1: DASHBOARD TEMÁTICO (Estilo Netflix / adescargar.net)
             ════════════════════════════════════════════════════════════ */
          <>
            {/* 1. Sección ⭐ Destacados (Hero) */}
            {featuredApps.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
                  <h2 className="text-xl font-extrabold tracking-tight">Destacados</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredApps.map((app) => {
                    const isMod =
                      app.name.toLowerCase().includes("mod") ||
                      app.description.toLowerCase().includes("mod");
                    return (
                      <Link href={`/apps/${app.id}`} key={app.id} className="group">
                        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-xl border border-gray-200/60 dark:border-slate-700/50 transition-all duration-300 flex items-start gap-4 h-full">
                          <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 shadow-sm animate-pulse">
                            🔥 POPULAR
                          </span>

                          <div className="w-16 h-16 shrink-0 relative">
                            {app.icon_url || app.image_url ? (
                              <img
                                src={app.icon_url || app.image_url!}
                                alt={app.name}
                                className="w-full h-full aspect-square object-cover rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center shadow-sm">
                                <span className="text-xs font-bold text-gray-400">VIP</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 pr-12">
                            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white truncate leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {app.name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">
                              {app.description}
                            </p>
                            
                            <div className="flex items-center gap-2 mt-2">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300">
                                {app.category}
                              </span>
                              {isMod && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                                  MOD
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Sección 📈 Tendencias - Lo más visto hoy */}
            {trendingApps.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                    <h2 className="text-xl font-extrabold tracking-tight">Lo más visto hoy</h2>
                  </div>
                </div>
                {/* Carrusel Horizontal */}
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide">
                  {trendingApps.map((app) => (
                    <div key={app.id} className="w-40 sm:w-48 shrink-0 snap-start">
                      <AppCard app={app} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 2. Sección 🔄 Actualizaciones Recientes */}
            {recentApps.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
                    <h2 className="text-xl font-extrabold tracking-tight">Actualizaciones Recientes</h2>
                  </div>
                  <button
                    onClick={() => setActiveCategory("Aplicaciones")}
                    className="text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 cursor-pointer"
                  >
                    Ver todas <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Carrusel Horizontal */}
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide">
                  {recentApps.map((app) => (
                    <div key={app.id} className="w-40 sm:w-48 shrink-0 snap-start">
                      <AppCard app={app} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 3. Sección 📈 Recomendaciones / Más Populares */}
            {popularApps.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
                    <h2 className="text-xl font-extrabold tracking-tight">Recomendaciones para ti</h2>
                  </div>
                </div>
                {/* Carrusel Horizontal */}
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide">
                  {popularApps.map((app) => (
                    <div key={app.id} className="w-40 sm:w-48 shrink-0 snap-start">
                      <AppCard app={app} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. Sección 🎮 Juegos Populares */}
            {popularGames.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
                    <h2 className="text-xl font-extrabold tracking-tight">Juegos Populares</h2>
                  </div>
                  <button
                    onClick={() => setActiveCategory("Juegos")}
                    className="text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 cursor-pointer"
                  >
                    Ver todos <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Carrusel Horizontal */}
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide">
                  {popularGames.map((app) => (
                    <div key={app.id} className="w-40 sm:w-48 shrink-0 snap-start">
                      <AppCard app={app} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 5. Sección 📱 Apps Populares */}
            {popularSoftwares.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AppWindow className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
                    <h2 className="text-xl font-extrabold tracking-tight">Aplicaciones Populares</h2>
                  </div>
                  <button
                    onClick={() => setActiveCategory("Aplicaciones")}
                    className="text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 cursor-pointer"
                  >
                    Ver todas <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Carrusel Horizontal */}
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide">
                  {popularSoftwares.map((app) => (
                    <div key={app.id} className="w-40 sm:w-48 shrink-0 snap-start">
                      <AppCard app={app} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          /* ════════════════════════════════════════════════════════════
             VISTA 2: LISTADO EN CUADRÍCULA (Búsqueda o Categoría activa)
             ════════════════════════════════════════════════════════════ */
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                {searchTerm ? (
                  <Search className="w-5 h-5 text-indigo-605 dark:text-indigo-400" />
                ) : (
                  <Sparkles className="w-5 h-5 text-indigo-605 dark:text-indigo-400" />
                )}
                {searchTerm ? `Resultados de "${searchTerm}"` : activeCategory === "VIP" ? "Membresías VIP" : activeCategory}
              </h2>
              <span className="text-xs text-gray-500 dark:text-slate-400 font-bold">
                {filteredApps.length} disponible{filteredApps.length !== 1 ? "s" : ""}
              </span>
            </div>

            {filteredApps.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
                {filteredApps.map((app) => (
                  <AppCard key={app.id} app={app} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-800/40 rounded-2xl border border-gray-200/50 dark:border-slate-800/60">
                <p className="text-gray-900 dark:text-white font-extrabold">No hay aplicaciones disponibles</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Intenta restablecer la búsqueda o seleccionar otra categoría.
                </p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
