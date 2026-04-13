"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/auth-store";
import { useApps, useCreateApp, useDeleteApp, useUploadImage } from "@/hooks/use-apps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  ExternalLink,
  Download,
  MoreVertical,
  Crown,
  Package,
  TrendingDown,
  Users,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

const appSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  downloadUrl: z.string().url("Debe ser una URL válida"),
  categoryId: z.string().min(1, "La categoría es requerida"),
});

type AppFormData = z.infer<typeof appSchema>;

export default function AdminDashboardPage() {
  const { user, isAdmin, logout } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useApps();
  const createApp = useCreateApp();
  const deleteApp = useDeleteApp();
  const uploadImage = useUploadImage();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppFormData>({
    resolver: zodResolver(appSchema),
    defaultValues: {
      name: "",
      description: "",
      downloadUrl: "",
      categoryId: "",
    },
  });

  // Redirect if not admin (client-side only)
  if (typeof window !== "undefined" && !isAdmin) {
    router.push("/");
    return null;
  }

  const handleUpload = async (file: File): Promise<string> => {
    console.log("========================================");
    console.log("[ADMIN PAGE] handleUpload() - Starting upload for:", file.name);
    console.log("[ADMIN PAGE] File details:", { name: file.name, type: file.type, size: file.size });
    console.log("========================================");

    try {
      const result = await uploadImage.mutateAsync(file);
      console.log("[ADMIN PAGE] handleUpload() - Success! URL:", result.url);
      return result.url;
    } catch (error: any) {
      console.error("========================================");
      console.error("[ADMIN PAGE] handleUpload() - ERROR");
      console.error("========================================");
      console.error("[ADMIN PAGE] Error object:", error);
      console.error("[ADMIN PAGE] Error response:", error.response?.data);
      console.error("[ADMIN PAGE] Error status:", error.response?.status);
      console.error("========================================");

      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Error al subir la imagen";
      toast.error(errorMsg);
      throw error;
    }
  };

  const onSubmit = async (formData: AppFormData) => {
    console.log("========================================");
    console.log("[ADMIN PAGE] onSubmit() - Form submitted");
    console.log("[ADMIN PAGE] formData:", JSON.stringify(formData, null, 2));
    console.log("[ADMIN PAGE] iconFile:", iconFile ? { name: iconFile.name, type: iconFile.type, size: iconFile.size } : "NULL");
    console.log("[ADMIN PAGE] imageFile:", imageFile ? { name: imageFile.name, type: imageFile.type, size: imageFile.size } : "NULL");
    console.log("========================================");

    if (!iconFile || !imageFile) {
      console.error("[ADMIN PAGE] ERROR: Missing files - iconFile:", !!iconFile, "imageFile:", !!imageFile);
      toast.error("El ícono y la imagen son requeridos");
      return;
    }

    try {
      console.log("[ADMIN PAGE] Starting parallel image uploads...");
      const [iconUrl, imageUrl] = await Promise.all([
        handleUpload(iconFile),
        handleUpload(imageFile),
      ]);

      console.log("[ADMIN PAGE] Both images uploaded. iconUrl:", iconUrl, "imageUrl:", imageUrl);

      const createPayload = {
        ...formData,
        iconUrl,
        imageUrl,
      };
      console.log("[ADMIN PAGE] Calling createApp.mutateAsync with payload:", JSON.stringify(createPayload, null, 2));

      await createApp.mutateAsync(createPayload);

      console.log("[ADMIN PAGE] App created successfully! Resetting form...");
      toast.success("¡Aplicación creada exitosamente!");
      reset();
      setIconFile(null);
      setImageFile(null);
      setOpen(false);
    } catch (error: any) {
      console.error("========================================");
      console.error("[ADMIN PAGE] onSubmit() - ERROR");
      console.error("========================================");
      console.error("[ADMIN PAGE] Error object:", error);
      console.error("[ADMIN PAGE] Error response:", error.response?.data);
      console.error("[ADMIN PAGE] Error status:", error.response?.status);
      console.error("[ADMIN PAGE] Error message:", error.message);
      console.error("========================================");

      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Error al crear la aplicación";
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteApp.mutateAsync(id);
      toast.success("¡Aplicación eliminada exitosamente!");
      setConfirmDelete(null);
    } catch (error) {
      toast.error("Error al eliminar la aplicación");
    }
  };

  const filteredApps = data?.apps?.filter(
    (app) =>
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalDownloads = data?.apps?.reduce((sum, app) => sum + app.downloadCount, 0) || 0;

  // Animated background for admin
  const AdminBackground = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 15, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-purple-500/15 to-fuchsia-500/15 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [360, 180, 0],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 18, repeat: Infinity }}
      />
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 relative">
      <AdminBackground />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            >
              <motion.div
                className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 group-hover:border-purple-500/30 transition-colors"
                whileHover={{ x: -3 }}
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.div>
            </Link>
            <div className="flex items-center gap-3">
              <motion.div
                className="p-2 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl shadow-lg shadow-amber-500/20"
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Crown className="w-5 h-5 text-black" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold text-white">Panel de Control</h1>
                <p className="text-xs text-slate-500">Gestiona tu catálogo de aplicaciones</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm text-slate-400 hover:text-purple-400 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-900/50">
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Ver Sitio</span>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { logout(); router.push("/"); }}
              className="border-red-800 text-red-400 hover:bg-red-900/20 text-xs"
            >
              <X className="w-3 h-3" />
              <span className="hidden sm:inline ml-1">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
        >
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/50 hover:border-purple-500/30 transition-all shadow-lg shadow-purple-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-400 text-sm font-medium flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  Total de Apps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-white">
                  {isLoading ? <Skeleton className="h-10 w-16" /> : data?.apps.length || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">Aplicaciones registradas</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/50 hover:border-green-500/30 transition-all shadow-lg shadow-green-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-400 text-sm font-medium flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                    <Download className="w-4 h-4 text-white" />
                  </div>
                  Total de Descargas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-white">
                  {isLoading ? (
                    <Skeleton className="h-10 w-24" />
                  ) : (
                    totalDownloads.toLocaleString("es-ES")
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-1">Descargas totales</p>
              </CardContent>
            </Card>
          </motion.div>

          <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/50 shadow-lg shadow-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-400 text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500">
                  <Users className="w-4 h-4 text-white" />
                </div>
                Administrador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-white">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Add App Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-6 gap-4 flex-wrap"
        >
          <div>
            <h2 className="text-xl font-bold text-white">Aplicaciones Registradas</h2>
            <p className="text-sm text-slate-500 mt-0.5">Gestiona todas las apps del catálogo</p>
          </div>
          <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) { reset(); setIconFile(null); setImageFile(null); } }}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Nueva
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-slate-800 text-white max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white text-xl flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  Agregar Nueva Aplicación
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Completa todos los campos para agregar una app al catálogo
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
                {/* File Uploads */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white text-sm flex items-center gap-2">
                      <div className="p-1 rounded bg-purple-500/20">
                        <Package className="w-3 h-3 text-purple-400" />
                      </div>
                      Ícono
                    </Label>
                    <motion.div
                      className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-slate-700 rounded-xl bg-slate-950/50 hover:border-purple-500/30 transition-colors"
                      whileHover={{ scale: 1.02 }}
                    >
                      {iconFile ? (
                        <motion.img
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          src={URL.createObjectURL(iconFile)}
                          alt="Vista previa"
                          className="w-16 h-16 rounded-xl object-cover shadow-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center">
                          <Package className="w-8 h-8 text-slate-600" />
                        </div>
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files && setIconFile(e.target.files[0])}
                        className="bg-slate-950 border-slate-800 text-xs cursor-pointer"
                      />
                    </motion.div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm flex items-center gap-2">
                      <div className="p-1 rounded bg-green-500/20">
                        <TrendingDown className="w-3 h-3 text-green-400" />
                      </div>
                      Captura
                    </Label>
                    <motion.div
                      className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-slate-700 rounded-xl bg-slate-950/50 hover:border-green-500/30 transition-colors"
                      whileHover={{ scale: 1.02 }}
                    >
                      {imageFile ? (
                        <motion.img
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          src={URL.createObjectURL(imageFile)}
                          alt="Vista previa"
                          className="w-full h-16 rounded-xl object-cover shadow-lg"
                        />
                      ) : (
                        <div className="w-full h-16 rounded-xl bg-slate-800 flex items-center justify-center">
                          <TrendingDown className="w-6 h-6 text-slate-600" />
                        </div>
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files && setImageFile(e.target.files[0])}
                        className="bg-slate-950 border-slate-800 text-xs cursor-pointer"
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Nombre de la Aplicación</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Ej: WhatsApp Messenger"
                    className="bg-slate-950/50 border-slate-800 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 rounded-lg"
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-white">Categoría</Label>
                  <select
                    id="category"
                    {...register("categoryId")}
                    className="w-full h-10 rounded-lg border border-slate-800 bg-slate-950/50 px-3 text-white text-sm focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                    aria-invalid={!!errors.categoryId}
                  >
                    <option value="">Selecciona una categoría</option>
                    <option value="juegos">🎮 Juego</option>
                    <option value="aplicaciones">📱 Aplicación</option>
                  </select>
                  {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
                </div>

                {/* Download URL */}
                <div className="space-y-2">
                  <Label htmlFor="downloadUrl" className="text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-green-400" />
                    Enlace de Descarga (Mediafire)
                  </Label>
                  <Input
                    id="downloadUrl"
                    {...register("downloadUrl")}
                    placeholder="https://www.mediafire.com/file/..."
                    className="bg-slate-950/50 border-slate-800 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 rounded-lg"
                    aria-invalid={!!errors.downloadUrl}
                  />
                  {errors.downloadUrl && <p className="text-sm text-destructive">{errors.downloadUrl.message}</p>}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Descripción Completa</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    rows={4}
                    placeholder="Describe las características y funcionalidades de la aplicación..."
                    className="bg-slate-950/50 border-slate-800 resize-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 rounded-lg"
                    aria-invalid={!!errors.description}
                  />
                  {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                </div>

                <DialogFooter className="gap-2">
                  <DialogClose asChild>
                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">Cancelar</Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={createApp.isPending || uploadImage.isPending}
                    className="bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 shadow-lg shadow-purple-500/25"
                  >
                    {createApp.isPending || uploadImage.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando...</>
                    ) : (
                      <><Plus className="mr-2 h-4 w-4" />Crear Aplicación</>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            type="text"
            placeholder="Buscar aplicaciones por nombre o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900/60 backdrop-blur border-slate-800 pl-11 pr-4 py-6 text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 rounded-xl"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>

        {/* Apps Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/50 overflow-hidden shadow-xl shadow-purple-500/5">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              ) : filteredApps.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/30">
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">Aplicación</th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4 hidden sm:table-cell">Categoría</th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4 hidden md:table-cell">Descargas</th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {filteredApps.map((app, index) => (
                        <motion.tr
                          key={app.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-slate-800/30 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <motion.img
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                src={app.iconUrl}
                                alt={app.name}
                                className="w-12 h-12 rounded-xl object-cover shadow-lg"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors truncate">{app.name}</p>
                                <p className="text-xs text-slate-500 truncate max-w-[200px]">{app.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden sm:table-cell">
                            <Badge variant="secondary" className="text-xs bg-slate-800/50 border-slate-700 group-hover:bg-purple-500/20 group-hover:border-purple-500/30 transition-colors">
                              {app.categoryName}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <span className="text-sm text-slate-400 flex items-center gap-1.5 group-hover:text-green-400 transition-colors">
                              <div className="p-1 rounded bg-slate-800 group-hover:bg-green-500/20 transition-colors">
                                <Download className="w-3 h-3" />
                              </div>
                              {app.downloadCount.toLocaleString("es-ES")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-slate-800">
                                    <MoreVertical className="w-4 h-4 text-slate-400" />
                                  </Button>
                                </motion.div>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                                <DropdownMenuItem
                                  onClick={() => setConfirmDelete(app.id)}
                                  className="text-red-400 focus:text-red-400 focus:bg-red-900/20 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center"
                  >
                    <Package className="w-10 h-10 text-slate-600" />
                  </motion.div>
                  <p className="text-slate-400 text-lg mb-2">
                    {searchTerm ? "No se encontraron resultados" : "Aún no hay aplicaciones"}
                  </p>
                  <p className="text-slate-600 text-sm">
                    {searchTerm ? "Intenta con otro término de búsqueda" : "Agrega la primera para comenzar"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-slate-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-lg flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              ¿Estás seguro de que deseas eliminar esta aplicación? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              disabled={deleteApp.isPending}
              variant="destructive"
              className="bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30"
            >
              {deleteApp.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Eliminando...</>
              ) : (
                <><Trash2 className="mr-2 h-4 w-4" />Sí, Eliminar</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
