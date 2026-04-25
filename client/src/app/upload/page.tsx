"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/auth-store";
import { ProtectedRoute } from "@/components/protected-route";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Upload, Loader2, Link2, ImagePlus, X,
  CheckCircle, Package, Bot, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = "https://wzeklbcmloxxvzqtxocq.supabase.co";
const SUPABASE_KEY = "sb_publishable_Irc_VuEUm_TMrVfB9dgf3g_UxAyGRVG";

const uploadSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  version: z.string().min(1, "La versión es requerida"),
  category: z.string().min(1, "La categoría es requerida"),
  download_url: z
    .string()
    .min(1, "El enlace de descarga es requerido")
    .url("Ingresa un enlace válido (https://...)"),
});
type UploadFormData = z.infer<typeof uploadSchema>;

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <UploadContent />
    </ProtectedRoute>
  );
}

function UploadContent() {
  const { profile } = useAuthStore();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStep, setUploadStep] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      name: "",
      description: "",
      version: "1.0.0",
      category: "aplicaciones",
      download_url: "",
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const onSubmit = async (formData: UploadFormData) => {
    setIsSubmitting(true);
    let imageUrl: string | null = null;

    try {
      // ── Step 1: Upload image to Supabase Storage ──────────
      if (imageFile) {
        setUploadStep("Subiendo imagen...");
        const ext = imageFile.name.split(".").pop() || "png";
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const uploadRes = await fetch(
          `${SUPABASE_URL}/storage/v1/object/app-images/${fileName}`,
          {
            method: "POST",
            headers: {
              "apikey": SUPABASE_KEY,
              "Authorization": `Bearer ${SUPABASE_KEY}`,
              "Content-Type": imageFile.type,
              "x-upsert": "true",
            },
            body: imageFile,
          }
        );

        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => null);
          throw new Error(
            (err as any)?.message || `Error al subir imagen (${uploadRes.status})`
          );
        }

        // ── Step 2: Get the public URL ──────────────────────
        imageUrl = `${SUPABASE_URL}/storage/v1/object/public/app-images/${fileName}`;
        console.log("Imagen subida:", imageUrl);
      }

      // ── Step 3: Insert into the applications table ────────
      setUploadStep("Guardando en base de datos...");
      const row = {
        name: formData.name,
        description: formData.description,
        version: formData.version,
        category: formData.category,
        download_url: formData.download_url,
        image_url: imageUrl,
      };
      console.log("Insertando:", row);

      const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Prefer": "return=representation",
        },
        body: JSON.stringify(row),
      });

      const body = await dbRes.json();

      if (!dbRes.ok) {
        console.error("DB Error:", body);
        throw new Error((body as any)?.message || JSON.stringify(body));
      }

      console.log("App insertada:", body);
      setIsSuccess(true);
      toast.success("¡Aplicación publicada exitosamente!");
      reset();
      clearImage();
    } catch (err: any) {
      console.error("Error:", err);
      alert("Error: " + (err?.message || String(err)));
      toast.error(err?.message || "Error al publicar");
    } finally {
      setIsSubmitting(false);
      setUploadStep("");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 relative">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-purple-500/15 to-fuchsia-500/15 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 15, repeat: Infinity }}
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
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl shadow-lg shadow-emerald-500/20">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Publicar App</h1>
                <p className="text-xs text-slate-500">
                  Agrega aplicaciones al catálogo
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <span>{profile?.name}</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 relative z-10 max-w-2xl">
        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/50 shadow-xl">
              <CardContent className="py-16 flex flex-col items-center gap-4">
                <div className="relative">
                  <CheckCircle className="w-20 h-20 text-emerald-400" />
                  <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  ¡Publicación exitosa!
                </h2>
                <p className="text-slate-400 text-center">
                  Tu aplicación ya está disponible en el catálogo.
                </p>
                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={() => setIsSuccess(false)}
                    className="bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700"
                  >
                    Publicar otra
                  </Button>
                  <Link href="/">
                    <Button
                      variant="outline"
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      Ir al catálogo
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/50 shadow-xl shadow-emerald-500/5">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  Nueva Aplicación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label className="text-white text-sm flex items-center gap-2">
                      <ImagePlus className="w-4 h-4 text-purple-400" />
                      Imagen / Captura de pantalla
                    </Label>
                    <div
                      onClick={() => imageInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${imagePreview
                          ? "border-emerald-500/50 bg-emerald-500/5"
                          : "border-slate-700 hover:border-slate-600 bg-slate-950/50"
                        }`}
                    >
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg shadow-lg"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearImage();
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500/90 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-emerald-400">
                            <CheckCircle className="w-4 h-4" />
                            {imageFile?.name}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-4">
                          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                            <ImagePlus className="w-8 h-8 text-slate-500" />
                          </div>
                          <p className="text-slate-400 text-sm">
                            Toca para seleccionar una imagen
                          </p>
                          <p className="text-xs text-slate-600">
                            JPG, PNG, WebP (recomendado 16:9)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="app-name"
                      className="text-white text-sm flex items-center gap-2"
                    >
                      📦 Nombre de la aplicación
                    </Label>
                    <Input
                      id="app-name"
                      {...register("name")}
                      placeholder="Ej: WhatsApp Plus, Free Fire MAX"
                      className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500/50 h-11"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-400">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Version + Category row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="app-version"
                        className="text-white text-sm flex items-center gap-2"
                      >
                        🏷️ Versión
                      </Label>
                      <Input
                        id="app-version"
                        {...register("version")}
                        placeholder="1.0.0"
                        className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500/50 h-11"
                      />
                      {errors.version && (
                        <p className="text-sm text-red-400">
                          {errors.version.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="app-category"
                        className="text-white text-sm flex items-center gap-2"
                      >
                        📂 Categoría
                      </Label>
                      <select
                        id="app-category"
                        {...register("category")}
                        className="w-full h-11 rounded-lg border border-slate-800 bg-slate-950/50 px-3 text-white text-sm focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors"
                      >
                        <option value="aplicaciones">📱 Aplicación</option>
                        <option value="juegos">🎮 Juego</option>
                      </select>
                      {errors.category && (
                        <p className="text-sm text-red-400">
                          {errors.category.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Download URL */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="app-download-url"
                      className="text-white text-sm flex items-center gap-2"
                    >
                      <Link2 className="w-4 h-4 text-cyan-400" />
                      Enlace de descarga
                    </Label>
                    <Input
                      id="app-download-url"
                      type="url"
                      {...register("download_url")}
                      placeholder="https://www.mediafire.com/file/... o https://mega.nz/..."
                      className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-500/50 h-11"
                    />
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500/60" />
                      Pega un enlace de MediaFire, Mega, Google Drive, etc.
                    </p>
                    {errors.download_url && (
                      <p className="text-sm text-red-400">
                        {errors.download_url.message}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="app-description"
                      className="text-white text-sm flex items-center gap-2"
                    >
                      📝 Descripción
                    </Label>
                    <Textarea
                      id="app-description"
                      {...register("description")}
                      rows={4}
                      placeholder="Describe brevemente la aplicación, funciones principales, requisitos..."
                      className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 resize-none focus:border-emerald-500/50"
                    />
                    {errors.description && (
                      <p className="text-sm text-red-400">
                        {errors.description.message}
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-800/60" />

                  {/* Submit */}
                  <button
                    id="upload-submit-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-semibold rounded-lg disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          {uploadStep || "Publicando..."}
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5" />
                          Publicar Aplicación
                        </>
                      )}
                    </span>
                  </button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </main>
  );
}
