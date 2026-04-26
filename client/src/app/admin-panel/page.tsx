"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Plus, Pencil, Trash2, ExternalLink, Loader2,
  Image as ImageIcon, X, Search, AlertTriangle,
  CheckCircle2, Database, Zap, ArrowLeft
} from "lucide-react";
import Link from "next/link";

// ==========================================
// CONFIGURACIÓN DEL SISTEMA
// ==========================================
const SYSTEM_CONFIG = {
  BUCKET_NAME: "app-images",
  TABLE_NAME: "applications",
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ==========================================
// TIPOS E INTERFACES
// ==========================================
interface Application {
  id: string;
  name: string;
  description: string;
  version: string;
  category: "Aplicación" | "Juego";
  download_url: string;
  image_url: string;
  status: "active" | "maintenance" | "deprecated";
  created_at: string;
  updated_at?: string;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function AdminPanel() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("TODOS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(SYSTEM_CONFIG.TABLE_NAME)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApps(data || []);
    } catch (err: any) {
      setNotification({ msg: "Error al sincronizar: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        activeCategory === "TODOS" || app.category.toUpperCase() === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [apps, searchTerm, activeCategory]);

  const deleteApp = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar esta aplicación?")) return;
    try {
      const { error } = await supabase.from(SYSTEM_CONFIG.TABLE_NAME).delete().eq("id", id);
      if (error) throw error;
      setNotification({ msg: "Aplicación eliminada con éxito", type: "success" });
      fetchData();
    } catch (err: any) {
      setNotification({ msg: err.message, type: "error" });
    }
  };

  return (
    <div className="min-h-screen bg-[#060a13] text-slate-200 font-sans antialiased">
      {/* ── NOTIFICACIÓN FLOTANTE ── */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-[999] flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-2xl shadow-2xl transition-all duration-500 ${
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertTriangle size={20} />
          )}
          <p className="font-semibold text-sm">{notification.msg}</p>
        </div>
      )}

      {/* ── FONDO DECORATIVO ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-blue-600/[0.04] blur-[140px] rounded-full" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-indigo-600/[0.04] blur-[140px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-12">
        {/* ── CABECERA ── */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
          <div className="space-y-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-400 transition-colors mb-3 uppercase tracking-widest"
            >
              <ArrowLeft size={14} /> Volver al inicio
            </Link>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-300 to-slate-500 bg-clip-text text-transparent">
              Panel Administrativo
            </h1>
            <p className="text-slate-500 font-medium text-base md:text-lg">
              Gestiona tu catálogo de aplicaciones y juegos
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Buscador */}
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input
                type="text"
                placeholder="Buscar aplicación..."
                className="w-full bg-white/[0.04] border border-white/[0.08] p-3.5 pl-11 rounded-xl outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-all font-medium text-sm text-slate-300 placeholder:text-slate-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Botón Nueva App */}
            <button
              onClick={() => {
                setEditingApp(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2.5 active:scale-[0.97] transition-all text-sm"
            >
              <Plus size={18} strokeWidth={3} /> Nueva Aplicación
            </button>
          </div>
        </header>

        {/* ── FILTROS DE CATEGORÍA ── */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {["TODOS", "APLICACIÓN", "JUEGO"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-lg text-xs font-bold tracking-wider transition-all border whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-white text-black border-white shadow-lg shadow-white/10"
                  : "bg-white/[0.03] text-slate-500 border-white/[0.06] hover:border-white/[0.15] hover:text-slate-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── GRILLA DE TARJETAS ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 bg-white/[0.02] border border-white/[0.04] rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          /* ── ESTADO VACÍO ── */
          <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/[0.08] rounded-2xl">
            <Database size={56} className="text-slate-800 mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
              No se encontraron resultados
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="group bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden transition-all duration-500 hover:border-blue-500/30 hover:bg-white/[0.04] hover:shadow-xl hover:shadow-blue-900/10"
              >
                {/* Imagen */}
                <div className="aspect-video relative overflow-hidden bg-slate-900">
                  {app.image_url ? (
                    <img
                      src={app.image_url}
                      alt={app.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-800">
                      <ImageIcon size={56} />
                    </div>
                  )}
                  {/* Badge Categoría */}
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-bold tracking-widest text-blue-400 border border-white/[0.08] uppercase">
                    {app.category}
                  </div>
                  {/* Badge Versión */}
                  <div className="absolute bottom-4 right-4 bg-blue-600 px-3 py-1 rounded-lg text-[11px] font-bold text-white shadow-lg">
                    v{app.version}
                  </div>
                </div>

                {/* Cuerpo */}
                <div className="p-6">
                  <h3 className="text-lg font-bold truncate text-white mb-2">
                    {app.name}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2">
                    {app.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setEditingApp(app);
                          setIsModalOpen(true);
                        }}
                        className="p-2.5 bg-white/[0.04] hover:bg-blue-600/20 text-blue-400 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => deleteApp(app.id)}
                        className="p-2.5 bg-white/[0.04] hover:bg-red-600/20 text-red-500 rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <a
                      href={app.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-slate-500 hover:text-white font-semibold text-xs uppercase tracking-wider transition-colors"
                    >
                      Enlace <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      {isModalOpen && (
        <AppModal
          app={editingApp}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => {
            setIsModalOpen(false);
            setNotification({ msg: "Aplicación guardada exitosamente", type: "success" });
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// ==========================================
// COMPONENTE MODAL
// ==========================================

function AppModal({
  app,
  onClose,
  onSaved,
}: {
  app: Application | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(app?.image_url || null);

  const [formData, setFormData] = useState({
    name: app?.name || "",
    description: app?.description || "",
    version: app?.version || "1.0.0",
    category: app?.category || "Aplicación",
    download_url: app?.download_url || "",
    status: app?.status || "active",
    image_url: app?.image_url || "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalImageUrl = formData.image_url;

      // Subir imagen al bucket si se seleccionó un archivo
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(SYSTEM_CONFIG.BUCKET_NAME)
          .upload(fileName, file);

        if (uploadError) throw new Error("Error al subir imagen: " + uploadError.message);

        const { data: urlData } = supabase.storage
          .from(SYSTEM_CONFIG.BUCKET_NAME)
          .getPublicUrl(fileName);

        finalImageUrl = urlData.publicUrl;
      }

      const payload = { ...formData, image_url: finalImageUrl };

      if (app) {
        // Actualizar aplicación existente
        const { error } = await supabase
          .from(SYSTEM_CONFIG.TABLE_NAME)
          .update(payload)
          .eq("id", app.id);
        if (error) throw error;
      } else {
        // Crear nueva aplicación
        const { error } = await supabase
          .from(SYSTEM_CONFIG.TABLE_NAME)
          .insert([payload]);
        if (error) throw error;
      }

      onSaved();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-[500]">
      <div className="bg-[#0b1020] border border-white/[0.08] w-full max-w-4xl rounded-2xl shadow-2xl shadow-black/60 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Cabecera del Modal */}
        <div className="px-8 py-6 border-b border-white/[0.06] flex justify-between items-center bg-white/[0.02]">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {app ? "Editar Aplicación" : "Nueva Aplicación"}
            </h2>
            <p className="text-xs font-semibold text-blue-400 mt-0.5 uppercase tracking-wider">
              Completa todos los campos
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/[0.06] rounded-xl transition-all text-slate-500 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSave} className="p-8 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LADO IZQUIERDO */}
            <div className="space-y-5">
              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Nombre
                </label>
                <input
                  required
                  className="w-full bg-white/[0.04] border border-white/[0.08] p-4 rounded-xl outline-none focus:border-blue-500/60 focus:bg-white/[0.06] transition-all font-semibold text-white placeholder:text-slate-600"
                  placeholder="Nombre de la aplicación"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Versión y Categoría */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Versión
                  </label>
                  <input
                    required
                    className="w-full bg-white/[0.04] border border-white/[0.08] p-4 rounded-xl outline-none focus:border-blue-500/60 transition-all font-semibold text-slate-300"
                    placeholder="1.0.0"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Categoría
                  </label>
                  <select
                    className="w-full bg-white/[0.04] border border-white/[0.08] p-4 rounded-xl outline-none focus:border-blue-500/60 transition-all font-semibold text-slate-300 appearance-none cursor-pointer"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as any })
                    }
                  >
                    <option value="Aplicación">Aplicación</option>
                    <option value="Juego">Juego</option>
                  </select>
                </div>
              </div>

              {/* URL de Descarga */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  URL de Descarga
                </label>
                <input
                  required
                  type="url"
                  className="w-full bg-white/[0.04] border border-white/[0.08] p-4 rounded-xl outline-none focus:border-blue-500/60 transition-all font-semibold text-sm text-blue-400 placeholder:text-slate-600"
                  placeholder="https://ejemplo.com/descarga"
                  value={formData.download_url}
                  onChange={(e) => setFormData({ ...formData, download_url: e.target.value })}
                />
              </div>

              {/* Descripción */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Descripción
                </label>
                <textarea
                  required
                  className="w-full bg-white/[0.04] border border-white/[0.08] p-4 rounded-xl h-28 outline-none focus:border-blue-500/60 transition-all font-medium resize-none text-sm leading-relaxed text-slate-300 placeholder:text-slate-600"
                  placeholder="Describe brevemente la aplicación..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            {/* LADO DERECHO — IMAGEN */}
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Logo / Imagen
                </label>
                {/*
                  ⚠️ FIX CRÍTICO: El <input type="file"> tiene z-50 y opacity-0.
                  La capa decorativa de hover tiene pointer-events-none y z-20.
                  Esto garantiza que el clic SIEMPRE llega al input real.
                */}
                <div className="relative aspect-video bg-white/[0.03] border-2 border-dashed border-white/[0.1] rounded-2xl overflow-hidden group hover:border-blue-500/40 transition-all cursor-pointer">
                  {/* Vista previa o placeholder */}
                  {preview ? (
                    <img
                      src={preview}
                      alt="Vista previa"
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-700 pointer-events-none">
                      <ImageIcon size={44} className="mb-2" />
                      <p className="text-[11px] font-bold uppercase tracking-widest">
                        Clic para cargar imagen
                      </p>
                    </div>
                  )}

                  {/* INPUT FILE — z-50, opacity-0, encima de todo */}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                    onChange={handleFileChange}
                  />

                  {/* Capa decorativa de hover — pointer-events-none, z-20, NO bloquea clics */}
                  <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-20 pointer-events-none">
                    <span className="font-bold text-xs uppercase tracking-widest text-white">
                      {preview ? "Cambiar Imagen" : "Seleccionar Imagen"}
                    </span>
                  </div>
                </div>

                {/* Indicador de archivo seleccionado */}
                {file && (
                  <p className="text-xs text-blue-400 font-medium mt-2 flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    {file.name}
                  </p>
                )}
              </div>

              {/* Info adicional visual */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Información
                </h4>
                <div className="space-y-2 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>Bucket de almacenamiento</span>
                    <span className="text-blue-400 font-mono font-semibold">app-images</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tabla</span>
                    <span className="text-blue-400 font-mono font-semibold">applications</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estado</span>
                    <span className="text-emerald-400 font-semibold">Activo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 font-bold text-slate-500 hover:text-white hover:bg-white/[0.04] rounded-xl transition-all text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-[2] bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20 text-sm text-white"
            >
              {saving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Zap size={18} className="fill-white" />
              )}
              {saving ? "Guardando..." : "Guardar Aplicación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}