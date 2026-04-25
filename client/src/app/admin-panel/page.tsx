"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Plus, Pencil, Trash2, ExternalLink, Loader2,
  Image as ImageIcon, X, Search, AlertTriangle,
  CheckCircle2, Database, Zap
} from "lucide-react";

// ==========================================
// CONFIGURACIÓN DEL SISTEMA
// ==========================================
const SYSTEM_CONFIG = {
  BUCKET_NAME: "app-images", // <--- AQUÍ ESTÁ EL ARREGLO DEFINITIVO EN MINÚSCULAS
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

export default function AdminPanelRestored() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("TODOS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

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
      setNotification({ msg: "Error al sincronizar: " + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "TODOS" || app.category.toUpperCase() === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [apps, searchTerm, activeCategory]);

  const deleteApp = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar esta aplicación?")) return;
    try {
      const { error } = await supabase.from(SYSTEM_CONFIG.TABLE_NAME).delete().eq('id', id);
      if (error) throw error;
      setNotification({ msg: "Aplicación eliminada con éxito", type: 'success' });
      fetchData();
    } catch (err: any) {
      setNotification({ msg: err.message, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-200 selection:bg-blue-500/40 font-sans">
      {/* NOTIFICACIÓN FLOTANTE */}
      {notification && (
        <div className={`fixed top-10 right-10 z-[999] flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-2xl animate-in slide-in-from-right-full duration-500 ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
          {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <p className="font-bold text-sm uppercase tracking-tight">{notification.msg}</p>
        </div>
      )}

      {/* DISEÑO DE FONDO (BLOOM EFECTOS) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto p-6 md:p-12">
        {/* CABECERA CON DISEÑO ORIGINAL */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16">
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-white via-slate-300 to-slate-500 bg-clip-text text-transparent">
              Panel Administrativo
            </h1>
            <p className="text-slate-500 font-medium text-lg">Gestiona tu catálogo de aplicaciones y juegos</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input
                type="text" placeholder="Buscar..."
                className="w-full bg-slate-900/50 border border-slate-800 p-4 pl-12 rounded-2xl outline-none focus:border-blue-500/50 transition-all font-medium"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => { setEditingApp(null); setIsModalOpen(true); }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <Plus size={20} strokeWidth={3} /> NUEVA APLICACIÓN
            </button>
          </div>
        </header>

        {/* FILTROS DE CATEGORÍA */}
        <div className="flex gap-3 mb-10 overflow-x-auto pb-2 no-scrollbar">
          {["TODOS", "APLICACIÓN", "JUEGO"].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-xl text-xs font-black tracking-widest transition-all border ${activeCategory === cat
                  ? "bg-white text-black border-white shadow-lg"
                  : "bg-slate-900/50 text-slate-500 border-slate-800 hover:border-slate-600"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* GRILLA DE TARJETAS (RESTAURADA) */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-96 bg-slate-900/40 border border-slate-800/50 rounded-[2.5rem] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredApps.map((app) => (
              <div key={app.id} className="group bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:border-blue-500/40 hover:bg-slate-900/60 hover:shadow-2xl">
                {/* Imagen del App */}
                <div className="aspect-video relative overflow-hidden bg-slate-800">
                  {app.image_url ? (
                    <img src={app.image_url} alt={app.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-700">
                      <ImageIcon size={64} />
                    </div>
                  )}
                  {/* Badge de Categoría */}
                  <div className="absolute top-5 left-5 bg-black/60 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-black tracking-widest text-blue-400 border border-white/5 uppercase">
                    {app.category}
                  </div>
                  {/* Badge de Versión */}
                  <div className="absolute bottom-5 right-5 bg-blue-600 px-3 py-1 rounded-lg text-xs font-bold text-white shadow-lg">
                    v{app.version}
                  </div>
                </div>

                {/* Cuerpo de la Tarjeta */}
                <div className="p-8">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-2xl font-black truncate pr-4 text-white uppercase tracking-tight">{app.name}</h3>
                  </div>

                  <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 line-clamp-3 h-15">
                    {app.description}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-800/50">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingApp(app); setIsModalOpen(true); }}
                        className="p-3 bg-white/5 hover:bg-blue-600/20 text-blue-400 rounded-xl transition-all"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => deleteApp(app.id)}
                        className="p-3 bg-white/5 hover:bg-red-600/20 text-red-500 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <a
                      href={app.download_url}
                      target="_blank"
                      className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors"
                    >
                      Enlace <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ESTADO VACÍO */}
        {!loading && filteredApps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 border border-dashed border-slate-800 rounded-[3rem]">
            <Database size={64} className="text-slate-800 mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest">No se encontraron resultados</p>
          </div>
        )}
      </div>

      {/* MODAL MAESTRO */}
      {isModalOpen && (
        <AppModal
          app={editingApp}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => { setIsModalOpen(false); fetchData(); }}
        />
      )}
    </div>
  );
}

// ==========================================
// COMPONENTE MODAL 
// ==========================================

function AppModal({ app, onClose, onSaved }: { app: Application | null; onClose: () => void; onSaved: () => void }) {
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
    image_url: app?.image_url || ""
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalImageUrl = formData.image_url;

      // PROCESO DE SUBIDA AL BUCKET
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(SYSTEM_CONFIG.BUCKET_NAME)
          .upload(fileName, file);

        if (uploadError) throw new Error('Error al subir imagen: ' + uploadError.message);

        const { data: urlData } = supabase.storage.from(SYSTEM_CONFIG.BUCKET_NAME).getPublicUrl(fileName);
        finalImageUrl = urlData.publicUrl;
      }

      const payload = { ...formData, image_url: finalImageUrl };

      if (app) {
        const { error } = await supabase.from(SYSTEM_CONFIG.TABLE_NAME).update(payload).eq('id', app.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(SYSTEM_CONFIG.TABLE_NAME).insert([payload]);
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
    <div className="fixed inset-0 bg-[#02040a]/95 backdrop-blur-xl flex items-center justify-center p-4 z-[500] animate-in fade-in duration-500">
      <div className="bg-[#0c111d] border border-white/10 w-full max-w-4xl rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden max-h-[90vh] flex flex-col">

        {/* Cabecera del Modal */}
        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">{app ? 'Editar Aplicación' : 'Nueva Aplicación'}</h2>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Completa los datos</p>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-white/5 rounded-2xl transition-all text-slate-500 hover:text-white">
            <X size={28} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-10 overflow-y-auto space-y-8 no-scrollbar">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* LADO IZQUIERDO: FORMULARIO */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre</label>
                <input
                  required className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-white"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Versión</label>
                  <input
                    required className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold"
                    value={formData.version} onChange={e => setFormData({ ...formData, version: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoría</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer"
                    value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                  >
                    <option value="Aplicación">Aplicación</option>
                    <option value="Juego">Juego</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">URL de Descarga</label>
                <input
                  required type="url" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-sm text-blue-400"
                  value={formData.download_url} onChange={e => setFormData({ ...formData, download_url: e.target.value })}
                />
              </div>
            </div>

            {/* LADO DERECHO: IMAGEN Y DESCRIPCIÓN */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Logo / Imagen</label>
                <div className="relative aspect-video bg-white/5 border-2 border-dashed border-white/10 rounded-[2rem] overflow-hidden group hover:border-blue-500/50 transition-all cursor-pointer">
                  {preview ? (
                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-700">
                      <ImageIcon size={48} className="mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Cargar Archivo</p>
                    </div>
                  )}
                  {/* FIX DE CLIC APLICADO AQUÍ */}
                  <input
                    type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setFile(f);
                        setPreview(URL.createObjectURL(f));
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-blue-600/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-20 pointer-events-none">
                    <span className="font-black text-xs uppercase tracking-widest">Cambiar Imagen</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descripción</label>
                <textarea
                  required className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl h-32 outline-none focus:border-blue-500 transition-all font-medium resize-none text-sm leading-relaxed"
                  value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/5">
            <button type="button" onClick={onClose} className="flex-1 py-5 font-black text-slate-500 hover:text-white transition-all uppercase tracking-widest text-[11px]">
              Cancelar
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-[2] bg-blue-600 hover:bg-blue-500 py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-2xl shadow-blue-900/30 text-[11px] uppercase tracking-widest text-white"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} className="fill-white" />}
              {saving ? 'Guardando...' : 'Guardar Aplicación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}