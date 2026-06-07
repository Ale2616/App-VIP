"use client";

import { useAuthStore } from "@/store/auth-store";
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp, useApps } from "@/hooks/use-apps";
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
  CheckCircle,
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
  Info,
  ArrowUp
} from "lucide-react";
import { toast } from "sonner";

// Pool de 25 reseñas realistas y variadas
const REVIEWS_POOL = [
  { name: "Juan Pérez", score: 5, comment: "Excelente aplicación, funciona de maravilla y el mod premium está genial." },
  { name: "María Gómez", score: 4, comment: "Muy buena, aunque a veces tarda un poco en abrir en mi dispositivo." },
  { name: "Carlos Ruiz", score: 5, comment: "100% recomendada. Todos los servidores activos y descargas rápidas." },
  { name: "Ana Belén", score: 5, comment: "Increíble mod. Llevo meses usándolo y no me ha dado ningún problema." },
  { name: "Diego Fernández", score: 3, comment: "Está bien, pero me gustaría que la interfaz fuera un poco más rápida." },
  { name: "Laura Castillo", score: 5, comment: "Buscaba esto hace tiempo. Instalación súper sencilla y limpia." },
  { name: "Pedro Jiménez", score: 4, comment: "Funciona perfecto. Muy agradecido con el VIP Team por esta joya." },
  { name: "Sofía Ortiz", score: 5, comment: "La mejor opción premium sin anuncios molestos. 10 de 10." },
  { name: "Lucas Vega", score: 4, comment: "Excelente versión. Muy estable en Android 13." },
  { name: "Valentina Luna", score: 5, comment: "Espectacular, todos los complementos desbloqueados perfectamente." },
  { name: "Mateo Silva", score: 3, comment: "Buena aplicación, pero en tablets la interfaz se estira un poco." },
  { name: "Isabella Cruz", score: 5, comment: "Maravillosa. No tiene publicidad y las funciones VIP van de lujo." },
  { name: "Gabriel Torres", score: 5, comment: "Una maravilla total. Todo desbloqueado sin fallos." },
  { name: "Lucía Ramos", score: 4, comment: "Todo correcto. Se instala sin problemas de firmas." },
  { name: "Andrés Castro", score: 5, comment: "Súper rápido y seguro. Ninguna alerta de Play Protect." },
  { name: "Daniela Ríos", score: 5, comment: "Genial, de verdad que vale la pena el VIP." },
  { name: "Alejandro Mendoza", score: 4, comment: "Muy fluida. Solo tuvo un cierre inesperado pero no se repitió." },
  { name: "Camila Blanco", score: 5, comment: "Todo desbloqueado al instante. Muy buen trabajo." },
  { name: "Nicolás Vargas", score: 5, comment: "Perfecto para el día a día. Recomendadísimo." },
  { name: "Gabriela Soto", score: 4, comment: "Instalación fácil y rápida. Todo correcto." },
  { name: "Martín Guerrero", score: 5, comment: "Increíble catálogo. Siempre suben las apps al día." },
  { name: "Paula Bravo", score: 5, comment: "Excelente soporte y mods limpios. Muy contenta." },
  { name: "Santiago Peña", score: 4, comment: "Buen rendimiento. La batería no se drena." },
  { name: "Elena Fuentes", score: 5, comment: "Fantástico mod. Todo va súper fluido." },
  { name: "Joaquín Marín", score: 5, comment: "Imprescindible en mi teléfono. Excelente." }
];

// Generador de números aleatorios con semilla basado en el ID de la app
const getSeededRandom = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return function () {
    let t = (h += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

function ExpandableDescription({ text, appName }: { text: string; appName: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-150 dark:border-slate-800/80 shadow-sm space-y-4">
      <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 pb-3">
        <Info className="w-5 h-5 text-blue-500" />
        <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
          Acerca de {appName}
        </h3>
      </div>
      <div>
        <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-2">
          ¿Qué es {appName} Pro?
        </h4>
        <p className={`text-gray-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm transition-all duration-300 ${isExpanded ? "" : "line-clamp-4"}`}>
          {text}
        </p>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-450 hover:text-blue-500 transition-colors cursor-pointer"
        >
          {isExpanded ? (
            <>
              Ver menos <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Ver más <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function formatInstalls(raw?: string | null): string {
  if (!raw || raw === "0") return "10K+";
  const cleaned = raw.replace(/[,.\s+]+/g, "");
  const num = parseInt(cleaned, 10);
  if (isNaN(num)) return raw;

  if (num >= 1_000_000_000) {
    const val = num / 1_000_000_000;
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1).replace(".", ",")}B+`;
  }
  if (num >= 1_000_000) {
    const val = num / 1_000_000;
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1).replace(".", ",")}M+`;
  }
  if (num >= 1_000) {
    const val = num / 1_000;
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1).replace(".", ",")}K+`;
  }
  return String(num);
}

export default function AppDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { data, isLoading } = useApp(params.id as string);
  const { data: suggestionsData } = useApps();
  const { isVip } = useAuthStore();
  const [downloadCount, setDownloadCount] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [iconError, setIconError] = useState(false);

  // Formulario de reseñas (Estado local reactivo)
  const [reviewName, setReviewName] = useState("");
  const [reviewEmail, setReviewEmail] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewStars, setReviewStars] = useState(5);
  const [hoverStars, setHoverStars] = useState<number | null>(null);
  const [reviewsList, setReviewsList] = useState<Array<{ name: string; score: number; comment: string; date: string }>>([]);

  const currentCount = downloadCount ?? data?.app?.download_count ?? 0;

  const isPremiumContent =
    data?.app?.is_premium === true ||
    data?.app?.category?.toLowerCase().trim() === "juegos pc" ||
    data?.app?.category?.toLowerCase().trim() === "software pc";

  // Inicializar reseñas aleatorias consistentes por ID de aplicación
  useEffect(() => {
    if (data?.app?.id) {
      const seededRandom = getSeededRandom(data.app.id);
      
      // Cantidad de reseñas: entre 3 y 5
      const count = Math.floor(seededRandom() * 3) + 3;
      
      // Mezclar pool usando el generador de semillas
      const shuffled = [...REVIEWS_POOL].sort(() => seededRandom() - 0.5);
      
      const selected = shuffled.slice(0, count).map((review) => {
        // Coherencia de fecha (últimos 30 días)
        const daysAgo = Math.floor(seededRandom() * 30);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        
        return {
          ...review,
          date: date.toLocaleDateString("es-ES")
        };
      });
      
      setReviewsList(selected);
    }
  }, [data?.app?.id]);

  useEffect(() => {
    if (data?.app?.id) {
      supabase.rpc("increment_view_count", { app_id: data.app.id })
        .then(({ error }) => {
          if (error) console.error("Error incrementando visitas:", error);
        });
    }
  }, [data?.app?.id]);

  const handleDownload = async () => {
    if (isPremiumContent && !isVip) {
      router.push("/planes");
      return;
    }
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
    if (isPremiumContent && !isVip) {
      router.push("/planes");
      return;
    }
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

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) {
      toast.error("Por favor completa los campos requeridos");
      return;
    }
    const newReview = {
      name: reviewName,
      score: reviewStars,
      comment: reviewComment,
      date: new Date().toLocaleDateString("es-ES")
    };
    setReviewsList(prev => [newReview, ...prev]);
    setReviewName("");
    setReviewEmail("");
    setReviewComment("");
    setReviewStars(5);
    toast.success("¡Reseña enviada con éxito!");
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center py-20">
        <div className="container mx-auto px-4 max-w-6xl space-y-6">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-60 w-full rounded-2xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-80 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!data?.app) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-200 dark:bg-slate-800 flex items-center justify-center">
            <span className="text-2xl font-bold text-slate-400">VIP</span>
          </div>
          <p className="text-gray-900 dark:text-white text-lg mb-6">Aplicación no encontrada</p>
          <Link href="/">
            <Button className="bg-blue-600 text-white hover:bg-blue-700 font-bold">
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
    app.mod ||
    app.name.toLowerCase().includes("mod") ||
    app.description.toLowerCase().includes("mod");
  
  const appScore = app.score || "4.5";
  
  let fileSizeMB = "Variable";
  if (app.file_size) {
    if (/^\d+$/.test(app.file_size)) {
      fileSizeMB = `${(parseInt(app.file_size, 10) / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      fileSizeMB = app.file_size;
    }
  }

  // Sugerencias
  const suggestions = suggestionsData?.apps?.filter((item: any) => item.id !== app.id).slice(0, 5) || [];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-gray-905 dark:text-slate-100 transition-colors duration-200 pb-12">
      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-custom::-webkit-scrollbar {
          height: 6px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 9999px;
        }
        .scrollbar-custom:hover::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.45);
        }
        .dark .scrollbar-custom:hover::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.55);
        }
      ` }} />

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        
        {/* Breadcrumbs */}
        <nav className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-6 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-blue-600 transition-colors">Inicio</Link>
          <span>/</span>
          <span className="hover:text-blue-600 cursor-pointer">{app.category}</span>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-bold">{app.name}</span>
        </nav>

        {/* CONTENEDOR PRINCIPAL GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
          
          {/* COLUMNA IZQUIERDA (70%) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* HERO / HEADER SECTION */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-slate-805/80">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6 text-center sm:text-left">
                <div className="relative shrink-0">
                  {!iconError && (app.icon_url || app.image_url) ? (
                    <img
                      src={app.icon_url || app.image_url!}
                      alt={app.name}
                      onError={() => setIconError(true)}
                      referrerPolicy="no-referrer"
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-[22%] object-cover shadow-md border border-gray-100 dark:border-slate-700/50"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[22%] bg-gray-100 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center shadow-inner">
                      <span className="text-xl font-bold text-gray-400">VIP</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
                    {app.name}
                  </h1>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    App VIP Team
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold">
                    {app.category} • {formatInstalls(app.installs)} descargas
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                    <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/30 font-extrabold text-[10px] py-1 px-2.5 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Verificado
                    </Badge>
                    <Badge className="bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200/30 font-extrabold text-[10px] py-1 px-2.5">
                      Versión {app.version || "1.0.0"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Botón de descarga principal */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-gray-100 dark:border-slate-700/50">
                {isPremiumContent && !isVip ? (
                  <Link href="/planes" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-60 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-extrabold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md">
                      <Crown className="w-4 h-4" /> Obtener VIP
                    </Button>
                  </Link>
                ) : (
                  <Button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full sm:w-60 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                  >
                    {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Obtener
                  </Button>
                )}
                <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500">
                  Contiene compras dentro de la app
                </span>
              </div>
            </div>

            {/* BARRA DE ESTADÍSTICAS */}
            <div className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-200/40 dark:border-slate-800 grid grid-cols-3 sm:grid-cols-6 gap-4 text-center divide-x-0 sm:divide-x divide-gray-200/60 dark:divide-slate-700/50">
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Calif.</p>
                <p className="text-sm font-extrabold text-gray-800 dark:text-white flex items-center justify-center gap-0.5">
                  ⭐ {appScore}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-404 dark:text-slate-500">Edad</p>
                <p className="text-sm font-extrabold text-gray-800 dark:text-white">{app.content_rating || "3+"}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-404 dark:text-slate-500">Categoría</p>
                <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400 truncate max-w-full px-1">{app.category}</p>
              </div>
              <div className="space-y-0.5 w-auto px-2 text-center min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-404 dark:text-slate-500">Mod</p>
                <div className="text-xs sm:text-sm font-extrabold text-gray-800 dark:text-white leading-tight break-words">
                  {typeof isMod === "string" ? isMod : (isMod ? "Sí" : "No")}
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-404 dark:text-slate-500">Versión</p>
                <p className="text-sm font-extrabold text-gray-800 dark:text-white truncate max-w-full px-1">{app.version || "1.0.0"}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-404 dark:text-slate-500">Tamaño</p>
                <p className="text-sm font-extrabold text-gray-800 dark:text-white">{fileSizeMB}</p>
              </div>
            </div>

            {/* GALERÍA DE IMÁGENES (Scroll Horizontal Adaptativo) */}
            {app.screenshots && app.screenshots.filter((s: string) => s && (s.startsWith("http://") || s.startsWith("https://"))).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500">
                  <Smartphone className="w-4 h-4 text-blue-500" />
                  <h3 className="text-xs font-extrabold uppercase tracking-widest">
                    Capturas de Pantalla
                  </h3>
                </div>
                <div className="flex overflow-x-auto gap-4 pb-3 scrollbar-custom scroll-smooth">
                  {app.screenshots.filter((s: string) => s && (s.startsWith("http://") || s.startsWith("https://"))).map((url: string, idx: number) => (
                    <div key={idx} className="shrink-0 rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-900 border border-gray-200/60 dark:border-slate-800/80 shadow-sm flex items-center justify-center h-80 sm:h-[450px]">
                      <img
                        src={url}
                        alt={`Captura ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="h-full w-auto object-contain rounded-2xl hover:scale-[1.02] transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECCIÓN ACERCA DE */}
            <ExpandableDescription text={app.description} appName={app.name} />

            {/* CAJA DE DESCARGA (Download Box) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-850 pb-3">
                <div className="flex items-center gap-3">
                  <FileDown className="w-5 h-5 text-blue-500 animate-bounce" />
                  <span className="font-extrabold text-sm text-gray-900 dark:text-white">{app.name}</span>
                </div>
                <Badge className="bg-blue-600 text-white font-extrabold text-[10px] py-0.5 px-2">
                  PREMIUM
                </Badge>
              </div>

              {app.download_options && app.download_options.length > 0 ? (
                <div className="space-y-3">
                  {app.download_options.map((opt: any, idx: number) => {
                    const isOptionDownloading = downloadingOptionId === opt.url;
                    return (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-800 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-slate-450">
                            APK
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">{opt.title || "Pro Option"}</p>
                            <p className="text-[10px] text-gray-400 dark:text-slate-500">{opt.size || fileSizeMB}</p>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          disabled={isOptionDownloading}
                          onClick={() => handleOptionDownload(opt.url, opt.title)}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg w-9 h-9"
                        >
                          {isOptionDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-slate-450">
                      APK
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">Pro</p>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500">{fileSizeMB}</p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    disabled={downloading}
                    onClick={handleDownload}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg w-9 h-9"
                  >
                    {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  </Button>
                </div>
              )}
            </div>

            {/* SECCIÓN DE RESEÑAS */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm space-y-6">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                Valoraciones y reseñas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-10 gap-6 items-center border-b border-gray-100 dark:border-slate-800 pb-6">
                {/* Nota Global */}
                <div className="md:col-span-3 text-center space-y-1">
                  <p className="text-5xl font-black text-gray-900 dark:text-white">{appScore}</p>
                  <div className="flex justify-center text-amber-500 gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const starVal = i + 1;
                      const scoreNum = parseFloat(appScore) || 0;
                      const isFull = starVal <= scoreNum;
                      const isHalf = !isFull && (starVal - 0.5) <= scoreNum;
                      return (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            isFull
                              ? "fill-amber-500 text-amber-500"
                              : isHalf
                              ? "fill-amber-500/50 text-amber-500"
                              : "fill-amber-500/20 text-amber-500/40"
                          }`}
                        />
                      );
                    })}
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500">128 valoraciones</p>
                </div>

                {/* Barras de Progreso */}
                <div className="md:col-span-7 space-y-1.5">
                  {[
                    { stars: 5, pct: "75%" },
                    { stars: 4, pct: "15%" },
                    { stars: 3, pct: "6%" },
                    { stars: 2, pct: "2%" },
                    { stars: 1, pct: "2%" }
                  ].map((row) => (
                    <div key={row.stars} className="flex items-center gap-3 text-xs">
                      <span className="w-2 font-bold text-gray-500 dark:text-slate-400">{row.stars}</span>
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: row.pct }} />
                      </div>
                      <span className="w-8 text-right font-bold text-gray-500 dark:text-slate-400">{row.pct}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lista de Reseñas */}
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2 scrollbar-thin">
                {reviewsList.map((review, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 dark:bg-slate-950/30 rounded-xl space-y-2 border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-gray-900 dark:text-white">{review.name}</span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500">{review.date}</span>
                    </div>
                    <div className="flex text-amber-500 gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.score ? "fill-amber-500" : "text-gray-350 dark:text-slate-700"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-900 dark:text-gray-100 opacity-80 leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>

              {/* Formulario Dejar Reseña */}
              <form onSubmit={handleAddReview} className="border-t border-gray-100 dark:border-slate-800 pt-6 space-y-4">
                <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">Dejar una reseña</h4>
                
                {/* Selector de estrellas */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400">Tu valoración:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => setReviewStars(val)}
                        onMouseEnter={() => setHoverStars(val)}
                        onMouseLeave={() => setHoverStars(null)}
                        className="p-1 cursor-pointer transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            val <= (hoverStars ?? reviewStars) ? "fill-amber-500 text-amber-500" : "text-gray-300 dark:text-slate-700"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="Nombre"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-250 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-white placeholder:text-gray-400"
                  />
                  <input
                    type="email"
                    placeholder="Email (opcional)"
                    value={reviewEmail}
                    onChange={(e) => setReviewEmail(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-250 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-white placeholder:text-gray-400"
                  />
                </div>

                <textarea
                  required
                  placeholder="Escribe tu comentario aquí..."
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-250 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-white placeholder:text-gray-400 resize-none"
                />

                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg text-xs transition-all shadow-md">
                  Enviar reseña
                </Button>
              </form>
            </div>

          </div>

          {/* COLUMNA DERECHA - SIDEBAR (30%) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white border-b border-gray-150 dark:border-slate-800 pb-2">
                Sugerencias
              </h3>
              
              <div className="space-y-4">
                {suggestions.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.icon_url || item.image_url || "/placeholder.png"}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-xl object-cover border border-gray-100 dark:border-slate-700"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400">
                          v{item.version || "1.0.0"}
                        </p>
                      </div>
                    </div>
                    <Link href={`/apps/${item.id}`}>
                      <Button size="sm" variant="secondary" className="text-[10px] font-bold py-1 px-3 h-7 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-md cursor-pointer">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}

                {suggestions.length === 0 && (
                  <p className="text-xs text-gray-450 dark:text-slate-500 italic">No hay sugerencias disponibles</p>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* PIE DE PÁGINA GLOBAL (Footer) */}
        <div className="mt-16 space-y-8 border-t border-gray-200 dark:border-slate-800 pt-10">
          
          {/* Bloque SEO */}
          <div className="space-y-3 max-w-4xl">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              Juegos y Aplicaciones para Android...
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-405 leading-relaxed">
              Descubre los mejores mods premium de aplicaciones y juegos para Android. En App VIP nos esforzamos por ofrecerte versiones verificadas y seguras sin costes ocultos. Disfruta de descargas a máxima velocidad y de la mejor selección diaria curada por nuestro equipo técnico especializado.
            </p>
          </div>

          {/* Links finales / Derechos de autor */}
          <div className="flex flex-col items-center justify-center gap-4 border-t border-gray-150 dark:border-slate-805 pt-8 mt-4">
            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 text-center">
              © 2026 App VIP. Todos los derechos reservados.
            </p>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-300 transition-all cursor-pointer"
              aria-label="Volver arriba"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </main>
  );
}
