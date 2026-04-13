"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useApp, useTrackDownload } from "@/hooks/use-apps";
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

function AppDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data, isLoading } = useApp(params.id as string);
  const trackDownload = useTrackDownload();

  const handleDownload = async () => {
    if (!data?.app) return;
    try {
      const result = await trackDownload.mutateAsync(data.app.id);
      window.open(result.downloadUrl, "_blank");
      toast.success("¡Descarga iniciada!");
    } catch (error) {
      toast.error("Error al rastrear la descarga");
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
          {/* App Header */}
          <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/50 mb-6 overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="relative shrink-0"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-3xl blur-xl opacity-50" />
                  <img
                    src={app.iconUrl}
                    alt={app.name}
                    className="w-28 h-28 md:w-32 md:h-32 rounded-3xl object-cover relative z-10 shadow-2xl"
                  />
                </motion.div>

                <div className="flex-1">
                  <motion.h1
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl md:text-4xl font-bold text-white mb-3"
                  >
                    {app.name}
                  </motion.h1>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <Badge className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white border-0">
                      {app.categoryName}
                    </Badge>
                    <span className="text-sm text-slate-400 flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-green-400" />
                      {app.downloadCount.toLocaleString("es-ES")} descargas
                    </span>
                    <span className="text-sm text-slate-400 flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-400" />
                      Verificada
                    </span>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span>Segura</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span>Rápida</span>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>

          {/* Main Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 rounded-3xl blur-2xl" />
            <img
              src={app.imageUrl}
              alt={app.name}
              className="w-full h-64 md:h-96 object-cover rounded-3xl shadow-2xl relative z-10 border border-slate-800/50"
            />
          </motion.div>

          {/* Download Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleDownload}
                disabled={trackDownload.isPending}
                size="lg"
                className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 hover:from-green-600 hover:via-emerald-600 hover:to-green-600 py-7 text-lg font-semibold shadow-2xl shadow-green-500/25 hover:shadow-green-500/40 relative overflow-hidden group"
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <Download className="w-6 h-6 mr-2" />
                {trackDownload.isPending ? "Preparando..." : "Descargar Ahora"}
                <ExternalLink className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </motion.div>

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
                    <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{app.description}</p>
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
                      <p className="text-white font-semibold">{app.downloadCount.toLocaleString("es-ES")}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-800/50">
                      <Calendar className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Agregado</p>
                      <p className="text-white font-semibold">
                        {new Date(app.createdAt).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
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
        </motion.div>
      </div>
    </main>
  );
}

export default AppDetailPage;
