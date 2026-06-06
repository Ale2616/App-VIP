"use client";

import { useAuthStore } from "@/store/auth-store";
import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/hooks/use-apps";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  ArrowLeft,
  Calendar,
  ExternalLink,
  Star,
  Shield,
  Zap,
  Smartphone,
  Globe,
  CheckCircle,
  TrendingUp,
  Loader2,
  FileDown,
  HardDrive,
  ChevronDown,
  ChevronUp,
  Lock,
  Crown,
  AppWindow,
  Tag,
  User,
} from "lucide-react";
import { toast } from "sonner";

function ExpandableDescription({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      <p className={`text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm transition-all duration-300 ${isExpanded ? "" : "line-clamp-4"}`}>
        {text}
      </p>
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-indigo-650 dark:text-indigo-400 hover:text-indigo-500 transition-colors cursor-pointer"
      >
        {isExpanded ? (
          <>
            Leer menos <ChevronUp className="w-4 h-4" />
          </>
        ) : (
          <>
            Leer más <ChevronDown className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}

function ScreenshotSlider({ screenshots }: { screenshots: string[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="relative group/slider">
      <button
        type="button"
        onClick={() => scroll("left")}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full z-10 opacity-0 group-hover/slider:opacity-100 transition-opacity hidden md:flex items-center justify-center cursor-pointer"
        aria-label="Anterior"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => scroll("right")}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full z-10 opacity-0 group-hover/slider:opacity-100 transition-opacity hidden md:flex items-center justify-center cursor-pointer"
        aria-label="Siguiente"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <div ref={scrollRef} className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 scrollbar-hide">
        {screenshots.map((screenshot: string, idx: number) => (
          <div key={idx} className="relative group snap-center shrink-0">
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-900 border border-gray-200/50 dark:border-slate-800/60">
              <img src={screenshot} alt={`Captura ${idx + 1}`} referrerPolicy="no-referrer" className="w-auto h-72 sm:h-80 md:h-96 object-contain rounded-2xl transition-transform duration-500 group-hover:scale-[1.03]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Spec Table Row ─────────────────────────────────────── */
function SpecRow({
  icon: Icon,
  label,
  value,
  iconColor,
}: {
  icon: any;
  label: string;
  value: string;
  iconColor: string;
}) {
  return (
    <div className="spec-table-row flex items-center justify-between px-4 py-3 first:rounded-t-xl last:rounded-b-xl">
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-sm text-gray-500 dark:text-slate-400 font-bold">{label}</span>
      </div>
      <span className="text-sm font-extrabold text-gray-950 dark:text-white">{value}</span>
    </div>
  );
}

export default function AppDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { data, isLoading } = useApp(params.id as string);
  const { isVip } = useAuthStore();
  const [downloadCount, setDownloadCount] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [iconError, setIconError] = useState(false);

  const currentCount = downloadCount ?? data?.app?.download_count ?? 0;

  const isPremiumContent =
    data?.app?.is_premium === true ||
    data?.app?.category?.toLowerCase().trim() === "juegos pc";

  const handleDownload = async () => {
    if (!data?.app?.download_url) {
      toast.error("Esta app no tiene enlace de descarga");
      return;
    }

    setDownloading(true);
    try {
      const { error } = await supabase.rpc("increment_download", {
        app_id: params.id as string,
      });
      if (error) {
        console.error("Error incrementando descargas:", error);
      } else {
        setDownloadCount(currentCount + 1);
      }
      window.open(data.app.download_url, "_blank");
      toast.success("¡Descarga iniciada!");
    } catch (err: any) {
      console.error("Error en descarga:", err);
      window.open(data.app.download_url, "_blank");
      toast.success("¡Descarga iniciada!");
    } finally {
      setDownloading(false);
    }
  };

  const [downloadingOptionId, setDownloadingOptionId] = useState<string | null>(null);

  const handleOptionDownload = async (url: string, title: string) => {
    const optionId = url;
    setDownloadingOptionId(optionId);
    try {
      const { error } = await supabase.rpc("increment_download", {
        app_id: params.id as string,
      });
      if (error) {
        console.error("Error incrementando descargas:", error);
      } else {
        setDownloadCount(currentCount + 1);
      }
      window.open(url, "_blank");
      toast.success(`¡Descarga de "${title}" iniciada!`);
    } catch (err: any) {
      console.error("Error en descarga:", err);
      window.open(url, "_blank");
      toast.success(`¡Descarga de "${title}" iniciada!`);
    } finally {
      setDownloadingOptionId(null);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-20 mb-8" />
          <div className="flex flex-col items-center gap-4 mb-8">
            <Skeleton className="w-28 h-28 rounded-3xl" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-16 w-full rounded-2xl mb-8" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!data?.app) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-200 dark:bg-slate-800 flex items-center justify-center">
            <span className="text-2xl font-bold text-slate-400">VIP</span>
          </div>
          <p className="text-gray-900 dark:text-white text-lg mb-6">Aplicación no encontrada</p>
          <Link href="/">
            <Button className="bg-indigo-650 text-white hover:bg-indigo-755">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al catálogo
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  const app = data.app;
  const isMod =
    app.name.toLowerCase().includes("mod") ||
    app.description.toLowerCase().includes("mod");
  let fileSizeMB = "Variable";
  if (app.file_size) {
    if (/^\d+$/.test(app.file_size)) {
      fileSizeMB = `${(parseInt(app.file_size, 10) / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      fileSizeMB = app.file_size;
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 transition-colors duration-200">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Botón Volver */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-650 dark:text-slate-450 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6 group cursor-pointer"
        >
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200/50 dark:border-slate-800/60 shadow-sm group-hover:border-indigo-500/30">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold">Volver</span>
        </button>

        <div className="bg-white dark:bg-slate-800/50 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/60 dark:border-slate-800/60">
          
          {/* ═══ Cabecera Impecable (Logo, Título, Resumen) ═══ */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 text-center sm:text-left">
            <div className="relative shrink-0">
              {!iconError && (app.icon_url || app.image_url) ? (
                <img
                  src={app.icon_url || app.image_url!}
                  alt={app.name}
                  onError={() => setIconError(true)}
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl object-cover shadow-md border border-gray-200/50 dark:border-slate-700/50"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-gray-100 dark:bg-slate-800 border border-gray-200/50 dark:border-slate-700/50 flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-400">VIP</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight mb-2">
                {app.name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-3">
                {app.description.slice(0, 150)}...
              </p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-none font-bold text-xs">
                  {app.category}
                </Badge>
                {isMod && (
                  <Badge className="bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-none font-bold text-xs">
                    MOD
                  </Badge>
                )}
                {app.is_premium && (
                  <Badge className="bg-amber-55 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-none font-bold text-xs flex items-center gap-1">
                    <Crown className="w-3 h-3" /> VIP
                  </Badge>
                )}
                <span className="text-xs text-gray-400 dark:text-slate-500 font-semibold flex items-center gap-1">
                  <Download className="w-3 h-3" /> {currentCount.toLocaleString("es-ES")} descargas
                </span>
              </div>
            </div>
          </div>

          {/* ═══ Tabla de Especificaciones ═══ */}
          <div className="mb-8">
            <h3 className="text-xs font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">
              Ficha Técnica
            </h3>
            <div className="border border-gray-200/60 dark:border-slate-800/65 rounded-xl overflow-hidden divide-y divide-gray-200/40 dark:divide-slate-800/40">
              <SpecRow icon={Tag} label="Versión" value={app.version || "Última"} iconColor="text-purple-500" />
              <SpecRow icon={HardDrive} label="Tamaño" value={fileSizeMB} iconColor="text-blue-500" />
              {app.score && <SpecRow icon={Star} label="Calificación" value={`${app.score} / 5.0`} iconColor="text-yellow-500" />}
              {app.installs && <SpecRow icon={Download} label="Instalaciones Play Store" value={app.installs} iconColor="text-blue-550" />}
              <SpecRow icon={User} label="Desarrollador" value="App VIP Team" iconColor="text-amber-500" />
              <SpecRow icon={AppWindow} label="Categoría" value={app.category} iconColor="text-emerald-500" />
              <SpecRow icon={Calendar} label="Fecha de subida" value={app.created_at ? new Date(app.created_at).toLocaleDateString("es-ES") : "Reciente"} iconColor="text-pink-500" />
              <SpecRow icon={CheckCircle} label="Seguridad" value="100% Verificado ✓" iconColor="text-green-500" />
            </div>
          </div>

          {/* ═══ Botón de Descarga Gigante / Opciones de Descarga ═══ */}
          <div className="mb-8">
            {isPremiumContent && !isVip ? (
              <div className="rounded-2xl border border-amber-300/30 bg-amber-500/5 dark:bg-amber-500/5 p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Descarga VIP Premium</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-4">
                  Obtén acceso ilimitado y descarga esta aplicación uniéndote a nuestra membresía VIP.
                </p>
                <Link href="/planes">
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-extrabold py-3.5 rounded-xl shadow-md">
                    <Crown className="w-4 h-4 mr-2" />
                    Unirse a VIP Premium
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {app.download_options && app.download_options.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                      <FileDown className="w-4 h-4 text-indigo-500" />
                      Elige un enlace de descarga
                    </h4>
                    {app.download_options.map((opt: any, idx: number) => {
                      const isDownloading = downloadingOptionId === opt.url;
                      return (
                        <button
                          key={idx}
                          disabled={isDownloading}
                          onClick={() => handleOptionDownload(opt.url, opt.title)}
                          className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-800/40 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200/50 dark:border-slate-800/50 hover:border-indigo-500/30 transition-all cursor-pointer group disabled:opacity-60 disabled:cursor-wait"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-extrabold text-gray-900 dark:text-white truncate">{opt.title}</p>
                              {opt.version && <p className="text-[10px] text-gray-400 dark:text-slate-500">Versión {opt.version}</p>}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {opt.size && (
                              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 px-2 py-0.5 bg-gray-200/40 dark:bg-slate-700/60 rounded">
                                {opt.size}
                              </span>
                            )}
                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-550 transition-colors" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Botón Gigante */
                  <button
                    disabled={downloading}
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 py-5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-lg shadow-lg hover:shadow-xl hover:shadow-indigo-500/10 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-75 disabled:cursor-wait"
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Descargando...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" /> Descargar Ahora
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>

          {/* ═══ Capturas de Pantalla ═══ */}
          {app.screenshots && app.screenshots.filter((s: string) => s && (s.startsWith("http://") || s.startsWith("https://"))).length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-indigo-500" />
                Capturas de Pantalla
              </h3>
              <ScreenshotSlider screenshots={app.screenshots.filter((s: string) => s && (s.startsWith("http://") || s.startsWith("https://")))} />
            </div>
          )}

          {/* ═══ Acerca de / Descripción ═══ */}
          <div className="mb-8 pt-6 border-t border-gray-200/50 dark:border-slate-800/60">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-3">
              Descripción de {app.name}
            </h3>
            <ExpandableDescription text={app.description} />
          </div>

          {/* ═══ Instrucciones de Instalación ═══ */}
          <div className="bg-gray-50 dark:bg-slate-800/30 rounded-2xl p-6 border border-gray-200/40 dark:border-slate-800/50 mb-4">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-650 dark:text-indigo-400" />
              Guía de Instalación
            </h3>
            
            <div className="space-y-4">
              {[
                {
                  step: "01",
                  title: "Descarga la aplicación",
                  desc: "Presiona el botón de descarga superior y espera a que el archivo se guarde.",
                },
                {
                  step: "02",
                  title: "Habilita Orígenes Desconocidos",
                  desc: "Si estás en Android, autoriza la instalación de archivos APK externos desde los ajustes de tu navegador.",
                },
                {
                  step: "03",
                  title: "Instala y Ejecuta",
                  desc: "Abre el archivo descargado y confirma los pasos de instalación en pantalla.",
                },
              ].map((inst) => (
                <div key={inst.step} className="flex gap-4 items-start">
                  <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 leading-none">
                    {inst.step}
                  </span>
                  <div>
                    <h4 className="text-xs font-extrabold text-gray-900 dark:text-white leading-none mb-1">
                      {inst.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                      {inst.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
