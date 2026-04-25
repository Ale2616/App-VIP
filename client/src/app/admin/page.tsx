"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Trash2, Pencil, Loader2, X, Crown, Package,
  Download, Search, RefreshCw, ExternalLink, ImagePlus,
  CheckCircle, AlertTriangle, Bot,
} from "lucide-react";
import { toast } from "sonner";
import type { App } from "@/types";

const SUPABASE_URL = "https://wzeklbcmloxxvzqtxocq.supabase.co";
const SUPABASE_KEY = "sb_publishable_Irc_VuEUm_TMrVfB9dgf3g_UxAyGRVG";
const TABLE = "applications";
const BUCKET = "APP-IMAGES";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

// ── helpers ──────────────────────────────────────────────────
async function fetchApps(): Promise<App[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABLE}?select=*&order=created_at.desc`,
    { headers }
  );
  if (!res.ok) throw new Error("Error al cargar apps");
  return res.json();
}

async function deleteAppRow(id: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`,
    { method: "DELETE", headers }
  );
  if (!res.ok) throw new Error("Error al eliminar");
}

async function deleteStorageFile(imageUrl: string) {
  // Extract filename from public URL:
  // .../storage/v1/object/public/app-images/filename.png → filename.png
  const parts = imageUrl.split(`/${BUCKET}/`);
  if (parts.length < 2) return;
  const fileName = parts[1];
  await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
}

async function updateAppRow(id: string, data: Record<string, unknown>) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`,
    {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error((err as any)?.message || `Error ${res.status}`);
  }
  return res.json();
}

async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": file.type,
        "x-upsert": "true",
      },
      body: file,
    }
  );
  if (!res.ok) throw new Error("Error al subir imagen");
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileName}`;
}

// ── Zod schema ───────────────────────────────────────────────
const editSchema = z.object({
  name: z.string().min(1, "Requerido"),
  description: z.string().min(1, "Requerido"),
  version: z.string().min(1, "Requerido"),
  category: z.string().min(1, "Requerido"),
  download_url: z.string().url("URL inválida"),
});
type EditFormData = z.infer<typeof editSchema>;

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function AdminPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingApp, setEditingApp] = useState<App | null>(null);

  const loadApps = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApps();
      setApps(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  const filtered = apps.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.category ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDownloads = apps.reduce(
    (sum, a) => sum + (a.download_count ?? 0),
    0
  );

  // ── Delete ───────────────────────────────────
  const handleDelete = async (app: App) => {
    setDeletingId(app.id);
    try {
      // 1. Delete image from storage if exists
      if (app.image_url) {
        await deleteStorageFile(app.image_url).catch(() => {});
      }
      if (app.icon_url) {
        await deleteStorageFile(app.icon_url).catch(() => {});
      }
      // 2. Delete row
      await deleteAppRow(app.id);
      setApps((prev) => prev.filter((a) => a.id !== app.id));
      toast.success(`"${app.name}" eliminada`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 relative">
      {/* BG */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-purple-500/15 to-fuchsia-500/15 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 18, repeat: Infinity }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                <ArrowLeft className="w-5 h-5" />
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl shadow-lg shadow-amber-500/20">
                <Crown className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Panel de Administrador
                </h1>
                <p className="text-xs text-slate-500">
                  Gestiona tu catálogo de aplicaciones
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadApps}
              disabled={loading}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw
                className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
              />
              Recargar
            </Button>
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Ver Sitio</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/50">
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
                {loading ? (
                  <Skeleton className="h-10 w-16" />
                ) : (
                  apps.length
                )}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-400 text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                  <Download className="w-4 h-4 text-white" />
                </div>
                Descargas Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white">
                {loading ? (
                  <Skeleton className="h-10 w-24" />
                ) : (
                  totalDownloads.toLocaleString("es-ES")
                )}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-400 text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                Conectado a Supabase
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            type="text"
            placeholder="Buscar apps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900/60 border-slate-800 pl-11 pr-4 py-6 text-white placeholder:text-slate-600 rounded-xl"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1 hover:bg-slate-800 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Table */}
        <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/50 overflow-hidden shadow-xl">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="divide-y divide-slate-800/50">
                {filtered.map((app) => (
                  <motion.div
                    key={app.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-4 p-4 hover:bg-slate-800/20 transition-colors group"
                  >
                    {/* Thumbnail */}
                    <div className="shrink-0">
                      {app.image_url || app.icon_url ? (
                        <img
                          src={app.image_url || app.icon_url!}
                          alt={app.name}
                          className="w-14 h-14 rounded-xl object-cover shadow-lg border border-slate-800"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center">
                          <Package className="w-7 h-7 text-slate-600" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {app.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate max-w-[300px]">
                        {app.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-slate-800/50 border-slate-700"
                        >
                          {app.category}
                        </Badge>
                        {app.version && (
                          <span className="text-[10px] text-slate-600">
                            v{app.version}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-600 flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {(app.download_count ?? 0).toLocaleString("es-ES")}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingApp(app)}
                        className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-purple-400 hover:border-purple-500/30"
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>

                      {confirmDeleteId === app.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleDelete(app)}
                            disabled={deletingId === app.id}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs"
                          >
                            {deletingId === app.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              "Sí"
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmDeleteId(null)}
                            className="border-slate-700 text-slate-400 text-xs"
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmDeleteId(app.id)}
                          className="border-red-800/50 text-red-400 hover:bg-red-900/20 hover:border-red-600/50"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          <span className="hidden sm:inline">Eliminar</span>
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center">
                  <Package className="w-10 h-10 text-slate-600" />
                </div>
                <p className="text-slate-400 text-lg mb-2">
                  {searchTerm
                    ? "No se encontraron resultados"
                    : "Aún no hay aplicaciones"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingApp && (
          <EditModal
            app={editingApp}
            onClose={() => setEditingApp(null)}
            onSaved={(updated) => {
              setApps((prev) =>
                prev.map((a) => (a.id === updated.id ? updated : a))
              );
              setEditingApp(null);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════
// EDIT MODAL
// ═══════════════════════════════════════════════════════════════
function EditModal({
  app,
  onClose,
  onSaved,
}: {
  app: App;
  onClose: () => void;
  onSaved: (app: App) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    app.image_url || null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: app.name,
      description: app.description,
      version: app.version || "1.0.0",
      category: app.category,
      download_url: app.download_url || "",
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (formData: EditFormData) => {
    setSaving(true);
    try {
      let imageUrl = app.image_url;

      // If new image selected, upload it and delete old one
      if (newImageFile) {
        imageUrl = await uploadImage(newImageFile);
        // Delete old image from storage
        if (app.image_url) {
          await deleteStorageFile(app.image_url).catch(() => {});
        }
      }

      const result = await updateAppRow(app.id, {
        ...formData,
        image_url: imageUrl,
      });

      const updated = Array.isArray(result) ? result[0] : result;
      toast.success("¡Aplicación actualizada!");
      onSaved(updated);
    } catch (err: any) {
      toast.error(err.message);
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <Card className="bg-slate-900/95 backdrop-blur-xl border-slate-800 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500">
                <Pencil className="w-4 h-4 text-white" />
              </div>
              Editar Aplicación
            </CardTitle>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Image */}
              <div className="space-y-2">
                <Label className="text-white text-sm flex items-center gap-2">
                  <ImagePlus className="w-4 h-4 text-purple-400" />
                  Imagen
                </Label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 rounded-xl object-cover shadow-lg border border-slate-700"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                      <Package className="w-8 h-8 text-slate-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="bg-slate-950 border-slate-800 text-xs cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-600 mt-1">
                      Selecciona para reemplazar la imagen actual
                    </p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label className="text-white text-sm">📦 Nombre</Label>
                <Input
                  {...register("name")}
                  className="bg-slate-950/50 border-slate-800 text-white h-11"
                />
                {errors.name && (
                  <p className="text-xs text-red-400">{errors.name.message}</p>
                )}
              </div>

              {/* Version + Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white text-sm">🏷️ Versión</Label>
                  <Input
                    {...register("version")}
                    className="bg-slate-950/50 border-slate-800 text-white h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white text-sm">📂 Categoría</Label>
                  <select
                    {...register("category")}
                    className="w-full h-11 rounded-lg border border-slate-800 bg-slate-950/50 px-3 text-white text-sm"
                  >
                    <option value="aplicaciones">📱 Aplicación</option>
                    <option value="juegos">🎮 Juego</option>
                  </select>
                </div>
              </div>

              {/* Download URL */}
              <div className="space-y-2">
                <Label className="text-white text-sm flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-cyan-400" />
                  Enlace de descarga
                </Label>
                <Input
                  type="url"
                  {...register("download_url")}
                  className="bg-slate-950/50 border-slate-800 text-white h-11"
                />
                {errors.download_url && (
                  <p className="text-xs text-red-400">
                    {errors.download_url.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-white text-sm">📝 Descripción</Label>
                <Textarea
                  {...register("description")}
                  rows={3}
                  className="bg-slate-950/50 border-slate-800 text-white resize-none"
                />
                {errors.description && (
                  <p className="text-xs text-red-400">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
