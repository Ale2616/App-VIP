"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useApp } from "@/hooks/use-apps";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Download,
  ArrowLeft,
  Calendar,
  ExternalLink,
  Bot,
  Star,
  Shield,
  Zap,
  Smartphone,
  Globe,
  CheckCircle,
  TrendingUp,
  Clock,
  Loader2,
  FileDown,
  HardDrive,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";


// Animated background
function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => i);
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {particles.map((i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/10 rounded-full"
          style={{
            left: `${(i * 37 + 13) % 100}%`,
            top: `${(i * 53 + 7) % 100}%`,
          }}
          animate={{
            y: [0, -50, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 4 + (i % 3),
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

function ExpandableDescription({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      <p
        className={`text-slate-300 whitespace-pre-wrap leading-relaxed transition-all duration-300 ${
          isExpanded ? "" : "line-clamp-4"
        }`}
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
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

export default function AppDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { data, isLoading } = useApp(params.id as string);
  const [downloadCount, setDownloadCount] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Use local count if available, otherwise fall back to fetched data
  const currentCount = downloadCount ?? data?.app?.download_count ?? 0;

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
    const optionId = url; // Use URL as unique identifier
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
      <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900">
        <FloatingParticles />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-24 mb-8" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Skeleton className="w-32 h-32 rounded-3xl mb-4" />
            </div>
            <div className="md:col-span-2">
              <Skeleton className="h-10 w-3/4 mb-4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          </div>
          <Skeleton className="w-full h-80 rounded-3xl my-8" />
          <Skeleton className="h-14 w-full mb-6" />
          <Skeleton className="h-40 w-full" />
        </div>
      </main>
    );
  }

  if (!data?.app) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 flex items-center justify-center">
        <FloatingParticles />
        <div className="container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-900/50 border border-slate-800 flex items-center justify-center"
          >
            <Bot className="w-10 h-10 text-slate-600" />
          </motion.div>
          <p className="text-slate-400 text-lg mb-6">Aplicación no encontrada</p>
          <Link href="/">
            <Button className="bg-gradient-to-r from-purple-500 to-fuchsia-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al catálogo
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  const app = data.app;

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 relative overflow-hidden">
      <FloatingParticles />

      {/* Gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/15 to-cyan-500/15 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 group-hover:border-purple-500/30 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Volver</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          {/* Main Content Layout */}
          <div className="flex flex-col items-center mb-12">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="relative shrink-0 mb-6"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-[2rem] blur-xl opacity-50" />
              {(app.icon_url || app.image_url) ? (
                 <img src={app.icon_url || app.image_url || undefined} alt={app.name} className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] object-cover relative z-10 shadow-2xl border-2 border-slate-800/50" />
               ) : (
                 <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] bg-slate-800 flex items-center justify-center relative z-10 shadow-2xl border-2 border-slate-800/50"><Bot className="w-16 h-16 text-slate-600" /></div>
               )}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl font-bold text-white mb-4 text-center"
            >
              {app.name}
            </motion.h1>

            {/* Tags */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-4 mb-8"
            >
              <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 text-sm font-medium">
                {app.category}
              </Badge>
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-300 bg-slate-900/50 border border-slate-800 rounded-full px-3 py-1">
                <Download className="w-4 h-4 text-emerald-400" />
                {currentCount.toLocaleString("es-ES")} descargas
              </div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-300 bg-slate-900/50 border border-slate-800 rounded-full px-3 py-1">
                <Shield className="w-4 h-4 text-emerald-400" /> Segura
              </div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-300 bg-slate-900/50 border border-slate-800 rounded-full px-3 py-1">
                <Zap className="w-4 h-4 text-amber-400" /> Rápida
              </div>
            </motion.div>

            {/* Download Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="w-full max-w-lg mb-8"
            >
              {/* If download_options exist, show option cards */}
              {app.download_options && app.download_options.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                    <FileDown className="w-4 h-4 text-emerald-400" />
                    Opciones de Descarga
                  </h3>
                  {app.download_options.map((opt: any, idx: number) => {
                    const isDownloading = downloadingOptionId === opt.url;
                    return (
                      <motion.button
                        key={idx}
                        type="button"
                        disabled={isDownloading}
                        onClick={() => handleOptionDownload(opt.url, opt.title)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/50 hover:border-emerald-500/30 hover:bg-slate-900/80 transition-all group cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                      >
                        {/* Icon */}
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/20 group-hover:from-emerald-500/30 group-hover:to-green-500/30 transition-all shrink-0">
                          {isDownloading ? (
                            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                          ) : (
                            <Download className="w-5 h-5 text-emerald-400" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{opt.title}</p>
                          {opt.version && (
                            <p className="text-xs text-slate-500 mt-0.5">{opt.version}</p>
                          )}
                        </div>

                        {/* Size badge */}
                        {opt.size && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50 shrink-0">
                            <HardDrive className="w-3 h-3 text-slate-500" />
                            <span className="text-xs font-medium text-slate-400">{opt.size}</span>
                          </div>
                        )}

                        {/* Arrow */}
                        <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0" />
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                /* Fallback: single download button */
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <button
                    type="button"
                    disabled={downloading}
                    onClick={handleDownload}
                    className="w-full inline-flex items-center justify-center bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 hover:from-green-600 hover:via-emerald-600 hover:to-green-600 py-4 text-lg font-semibold shadow-2xl shadow-green-500/25 hover:shadow-green-500/40 relative overflow-hidden group rounded-2xl text-white transition-all disabled:opacity-70 disabled:cursor-wait cursor-pointer"
                  >
                    <motion.span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 2, repeat: Infinity }} />
                    {downloading ? (
                      <><Loader2 className="w-6 h-6 mr-2 animate-spin" /> Procesando...</>
                    ) : (
                      <><Download className="w-6 h-6 mr-2" /> Descargar Ahora <ExternalLink className="w-5 h-5 ml-2 opacity-50" /></>
                    )}
                  </button>
                </motion.div>
              )}
            </motion.div>

            {/* Main Image (Optional banner) */}
            {app.image_url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="w-full relative mt-4"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 rounded-3xl blur-2xl" />
                <img src={app.image_url} alt={app.name} className="w-full h-64 md:h-[400px] object-cover rounded-3xl shadow-2xl relative z-10 border border-slate-800/50" />
              </motion.div>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="md:col-span-2"
            >
              <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/50 h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-purple-400" />
                    <h2 className="text-xl font-semibold text-white">Acerca de esta aplicación</h2>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    <ExpandableDescription text={app.description} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Info Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/50 h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Información</h3>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-800/50">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Descargas</p>
                      <p className="text-white font-semibold">{currentCount.toLocaleString("es-ES")}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-800/50">
                      <Calendar className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Agregado</p>
                      <p className="text-white font-semibold">
                        {app.created_at ? new Date(app.created_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }) : "Fecha no disponible"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-800/50">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Estado</p>
                      <p className="text-emerald-400 font-semibold">Verificada</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-800/50">
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Actualización</p>
                      <p className="text-white font-semibold">Reciente</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  Características de descarga
                </h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                      <Download className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Directa</p>
                      <p className="text-xs text-slate-500">Sin intermediarios</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Segura</p>
                      <p className="text-xs text-slate-500">Libre de virus</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Rápida</p>
                      <p className="text-xs text-slate-500">Alta velocidad</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Capturas de Pantalla */}
          {app.screenshots && app.screenshots.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-12"
            >
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Smartphone className="w-6 h-6 text-purple-400" />
                Capturas de Pantalla
              </h3>
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 scrollbar-hide">
                {app.screenshots.map((screenshot: string, idx: number) => (
                  <div key={idx} className="relative group snap-center shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
                    <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/50">
                      <img 
                        src={screenshot} 
                        alt={`Captura ${idx + 1}`} 
                        className="w-auto h-72 sm:h-80 md:h-96 object-contain rounded-2xl transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
