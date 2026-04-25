"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAuthStore } from "@/store/auth-store";
import { useApps, useTrackDownload } from "@/hooks/use-apps";
import { useLogActivity } from "@/hooks/use-visits";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download, Crown, LogOut, User, TrendingUp, Gamepad2, AppWindow,
  Bot, Search, X, Star, Zap, Shield, Globe, ChevronRight, Rocket,
  Sparkles, Upload,
} from "lucide-react";
import { toast } from "sonner";
import type { App } from "@/types";

type CategoryFilter = "all" | "juegos" | "aplicaciones" | "popular" | "most-downloaded";

const categories = [
  { id: "all" as const, label: "Todos", icon: Bot, color: "from-purple-500 to-fuchsia-500" },
  { id: "juegos" as const, label: "Juegos", icon: Gamepad2, color: "from-blue-500 to-cyan-500" },
  { id: "aplicaciones" as const, label: "Aplicaciones", icon: AppWindow, color: "from-green-500 to-emerald-500" },
  { id: "popular" as const, label: "Populares", icon: TrendingUp, color: "from-amber-500 to-orange-500" },
  { id: "most-downloaded" as const, label: "Descargados", icon: Download, color: "from-pink-500 to-rose-500" },
];

function FloatingParticles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }, (_, i) => (
        <motion.div key={i} className="absolute w-1 h-1 bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 rounded-full"
          style={{ left: `${(i*37+13)%100}%`, top: `${(i*53+7)%100}%` }}
          animate={{ y:[0,-100,0], opacity:[0,.8,0], scale:[0,1.5,0] }}
          transition={{ duration:5+(i%5), repeat:Infinity, delay:i*.2, ease:"easeInOut" }} />
      ))}
    </div>
  );
}

function GradientOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <motion.div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-500/30 to-fuchsia-500/30 rounded-full blur-3xl" animate={{ scale:[1,1.2,1] }} transition={{ duration:15, repeat:Infinity }} />
      <motion.div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl" animate={{ scale:[1.2,1,1.2] }} transition={{ duration:18, repeat:Infinity }} />
    </div>
  );
}

function AppCard({ app, index }: { app: App; index: number }) {
  const trackDownload = useTrackDownload();
  const handleDownload = async () => {
    try {
      const result = await trackDownload.mutateAsync(app.id);
      window.open(result.download_url, "_blank");
      toast.success("¡Descarga iniciada!");
    } catch { toast.error("Error al iniciar la descarga"); }
  };

  return (
    <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:index*.05 }} className="group">
      <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/50 hover:border-purple-500/30 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:shadow-purple-500/10">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <Link href={`/apps/${app.id}`} className="shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                {app.icon_url ? (
                  <img src={app.icon_url} alt={app.name} className="w-16 h-16 rounded-2xl object-cover relative z-10 shadow-lg" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center relative z-10 shadow-lg"><Package className="w-8 h-8 text-slate-600"/></div>
                )}
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/apps/${app.id}`}>
                <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors truncate">
                  {app.name}<ChevronRight className="inline-block w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
              </Link>
              <p className="text-sm text-slate-400 line-clamp-2 mt-1 group-hover:text-slate-300 transition-colors">{app.description}</p>
              <div className="flex items-center gap-3 mt-2.5">
                <Badge variant="secondary" className="text-xs bg-slate-800/50 border-slate-700">{app.category}</Badge>
                {app.version && <span className="text-xs text-slate-500">v{app.version}</span>}
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Download className="w-3 h-3" />{(app.download_count ?? 0).toLocaleString("es-ES")}
                </span>
              </div>
            </div>
            <Button onClick={handleDownload} disabled={trackDownload.isPending} className="shrink-0 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/25 px-5 h-10">
              <Download className="w-4 h-4 mr-2" />Descargar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Package({ className }: { className?: string }) {
  return <AppWindow className={className} />;
}

function AppCardSkeleton() {
  return (
    <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/50"><CardContent className="p-5"><div className="flex items-start gap-4"><Skeleton className="w-16 h-16 rounded-2xl" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-1/2" /></div><Skeleton className="h-10 w-28 rounded-lg" /></div></CardContent></Card>
  );
}

function HeroSection({ totalApps, totalDownloads }: { totalApps: number; totalDownloads: number }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0,500], [0,200]);
  const opacity = useTransform(scrollY, [0,300], [1,0]);
  return (
    <motion.div style={{ y, opacity }} className="relative py-16 md:py-24">
      <div className="container mx-auto px-4 text-center">
        <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:.8 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" /><span className="text-sm text-purple-300">El mejor catálogo de aplicaciones</span>
          </div>
        </motion.div>
        <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:.8, delay:.1 }} className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
          <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">Descubre las Mejores</span><br/>
          <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">Apps y Juegos</span>
        </motion.h1>
        <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:.8, delay:.2 }} className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Explora nuestro catálogo premium con las aplicaciones más populares y seguras
        </motion.p>
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:.8, delay:.3 }} className="flex flex-wrap justify-center gap-4 mb-12">
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500"><AppWindow className="w-5 h-5 text-white" /></div>
            <div><p className="text-2xl font-bold text-white">{totalApps}</p><p className="text-xs text-slate-500">Aplicaciones</p></div>
          </div>
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500"><Download className="w-5 h-5 text-white" /></div>
            <div><p className="text-2xl font-bold text-white">{(totalDownloads ?? 0).toLocaleString("es-ES")}</p><p className="text-xs text-slate-500">Descargas</p></div>
          </div>
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500"><Shield className="w-5 h-5 text-white" /></div>
            <div><p className="text-2xl font-bold text-white">100%</p><p className="text-xs text-slate-500">Seguro</p></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:.8, delay:.4 }} className="flex flex-wrap justify-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-400"><Zap className="w-4 h-4 text-yellow-400" /><span>Descargas rápidas</span></div>
          <div className="flex items-center gap-2 text-sm text-slate-400"><Star className="w-4 h-4 text-amber-400" /><span>Apps verificadas</span></div>
          <div className="flex items-center gap-2 text-sm text-slate-400"><Globe className="w-4 h-4 text-blue-400" /><span>Actualizado 24/7</span></div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-800/50 bg-slate-950/50 backdrop-blur-xl mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-lg"><Bot className="w-5 h-5 text-white" /></div>
              <span className="text-xl font-bold text-white">App VIP</span>
            </div>
            <p className="text-slate-400 text-sm">Tu destino premium para descubrir y descargar las mejores aplicaciones y juegos.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/" className="hover:text-purple-400 transition-colors">Inicio</Link></li>
              <li><Link href="/upload" className="hover:text-purple-400 transition-colors">Subir App</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Características</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2"><Rocket className="w-4 h-4 text-purple-400" /><span>Descargas directas</span></li>
              <li className="flex items-center gap-2"><Shield className="w-4 h-4 text-green-400" /><span>Apps verificadas</span></li>
              <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /><span>Actualizaciones constantes</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800/50 pt-8 text-center">
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} App VIP. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  const { isAuthenticated, isAdmin, logout, profile } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showHero, setShowHero] = useState(true);

  const category = activeCategory === "all" || activeCategory === "popular" || activeCategory === "most-downloaded" ? undefined : activeCategory;
  const mostDownloaded = activeCategory === "most-downloaded" || activeCategory === "popular";

  const { data, isLoading } = useApps(category, mostDownloaded);
  const logActivity = useLogActivity();

  const filteredApps = data?.apps?.filter((app) =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalDownloads = data?.apps?.reduce((sum, app) => sum + (app.download_count ?? 0), 0) || 0;

  const handleCategoryChange = useCallback((catId: CategoryFilter) => {
    setActiveCategory(catId);
    if (catId !== "all" && catId !== "popular" && catId !== "most-downloaded") setSearchTerm("");
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 relative">
      <FloatingParticles />
      <GradientOrbs />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-xl shadow-lg shadow-purple-500/20"><Bot className="w-5 h-5 text-white" /></div>
            <span className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">App VIP</span>
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link href="/upload">
                  <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-cyan-600 shadow-lg shadow-emerald-500/20">
                    <Upload className="w-4 h-4 mr-1" />Subir
                  </Button>
                </Link>
                {isAdmin && (
                  <Link href="/admin">
                    <Button size="sm" className="bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-semibold shadow-lg shadow-amber-500/20">
                      <Crown className="w-4 h-4 mr-1" />Panel
                    </Button>
                  </Link>
                )}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center"><User className="w-3 h-3 text-white" /></div>
                  <span className="text-sm text-slate-300">{profile?.name}</span>
                </div>
                <Button variant="destructive" size="sm" onClick={()=>{logout();toast.info("Sesión cerrada");}} className="bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login"><Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">Entrar</Button></Link>
                <Link href="/register"><Button size="sm" className="bg-gradient-to-r from-purple-500 to-fuchsia-600 shadow-lg shadow-purple-500/20">Registrarse</Button></Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {showHero && activeCategory === "all" && !searchTerm && (
        <HeroSection totalApps={data?.apps.length || 0} totalDownloads={totalDownloads} />
      )}

      {/* Search */}
      <div className="container mx-auto px-4 py-6">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input type="text" value={searchTerm} onChange={e=>{setSearchTerm(e.target.value);if(e.target.value)setShowHero(false)}} placeholder="Buscar aplicaciones o juegos..."
            className="w-full h-14 pl-12 pr-10 rounded-2xl bg-slate-900/80 border border-slate-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-base shadow-xl shadow-purple-500/5" />
          {searchTerm && (
            <button onClick={()=>setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="container mx-auto px-4 pb-8">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat, index) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button key={cat.id} onClick={()=>handleCategoryChange(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all duration-300 ${isActive ? `bg-gradient-to-r ${cat.color} text-white shadow-lg shadow-purple-500/25` : "bg-slate-900/50 text-slate-400 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"}`}>
                <Icon className="w-4 h-4" /><span className="text-sm font-medium">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Apps */}
      <div className="container mx-auto px-4 pb-20">
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <AppCardSkeleton key={i} />)
          ) : filteredApps.length > 0 ? (
            <>
              {searchTerm && <p className="text-sm text-slate-400">{filteredApps.length} resultado{filteredApps.length !== 1 ? "s" : ""} para &ldquo;{searchTerm}&rdquo;</p>}
              {filteredApps.map((app, index) => <AppCard key={app.id} app={app} index={index} />)}
            </>
          ) : (
            <motion.div className="text-center py-20" initial={{ opacity:0 }} animate={{ opacity:1 }}>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-900/50 border border-slate-800 flex items-center justify-center"><Search className="w-10 h-10 text-slate-700" /></div>
              <p className="text-slate-400 text-lg mb-2">{searchTerm ? `No se encontraron resultados para "${searchTerm}"` : "No se encontraron aplicaciones"}</p>
              <p className="text-slate-600 text-sm">{searchTerm ? "Intenta con otro término de búsqueda" : "Vuelve pronto para nuevas apps"}</p>
            </motion.div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
