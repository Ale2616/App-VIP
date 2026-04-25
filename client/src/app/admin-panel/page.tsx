"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Plus, Pencil, Trash2, ExternalLink, Loader2,
  Image as ImageIcon, ChevronRight, Monitor, X,
  LayoutGrid, Search, Filter, ShieldCheck,
  Download, Clock, Smartphone, Code2, AlertTriangle,
  CheckCircle2, RefreshCw, BarChart3, Database,
  Settings2, Layers, Zap
} from "lucide-react";

// --- NÚCLEO DE CONFIGURACIÓN ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- DEFINICIÓN DE TIPOS ---
type AppCategory = "Software" | "Gaming" | "Network" | "Security" | "Tools";

interface Application {
  id: string;
  name: string;
  description: string;
  version: string;
  category: AppCategory;
  download_url: string;
  image_url: string;
  status: "active" | "maintenance" | "deprecated";
  created_at: string;
  updated_at?: string;
}

interface Stats {
  total: number;
  active: number;
  latest: string;
}

// --- COMPONENTES DE UI ATÓMICOS ---

const Badge = ({ children, variant = "default" }: { children: React.ReactNode, variant?: string }) => {
  const styles: any = {
    default: "bg-slate-800 text-slate-300",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${styles[variant]}`}>
      {children}
    </span>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function AdminPanelPremium() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  // Efecto para cargar datos
  useEffect(() => {
    loadData();
  }, []);

  // Notificaciones automáticas
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApps(data || []);
    } catch (err: any) {
      setNotification({ msg: "Fallo en sincronización: " + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const stats: Stats = useMemo(() => ({
    total: apps.length,
    active: apps.filter(a => a.status === 'active').length,
    latest: apps.length > 0 ? apps[0].name : "N/A"
  }), [apps]);

  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "All" || app.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [apps, searchTerm, activeCategory]);

  const deleteApp = async (id: string) => {
    if (!confirm("CRÍTICO: ¿Confirmas la eliminación total de este registro?")) return;
    try {
      const { error } = await supabase.from('applications').delete().eq('id', id);
      if (error) throw error;
      setNotification({ msg: "Registro eliminado del núcleo", type: 'success' });
      loadData();
    } catch (err: any) {
      setNotification({ msg: err.message, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-200 selection:bg-blue-500/40 pb-20">
      {/* CAPA DE NOTIFICACIÓN */}
      {notification && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-2xl animate-in slide-in-from-right-full duration-300 ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
          {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <p className="font-bold text-sm tracking-tight">{notification.msg}</p>
        </div>
      )}

      {/* ELEMENTOS DE FONDO */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-[1400px] mx-auto p-6 md:p-12">
        {/* TOP NAVBAR */}
        <nav className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
              <Zap size={22} className="text-white fill-white" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">DevCoreX <span className="text-blue-500 italic">V3</span></span>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estado Servidor</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Operacional
              </span>
            </div>
            <button onClick={loadData} className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all text-slate-400 hover:text-white">
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </nav>

        {/* DASHBOARD STATS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { label: "Total Aplicaciones", val: stats.total, icon: Layers, color: "blue" },
            { label: "Nodos Activos", val: stats.active, icon: ShieldCheck, color: "emerald" },
            { label: "Última Actualización", val: stats.latest, icon: Database, color: "indigo" }
          ].map((s, i) => (
            <div key={i} className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-[2rem] flex items-center justify-between group hover:border-blue-500/30 transition-all">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                <p className="text-2xl font-black text-white truncate max-w-[200px]">{s.val}</p>
              </div>
              <div className={`p-4 bg-${s.color}-500/10 rounded-2xl text-${s.color}-500 group-hover:scale-110 transition-transform`}>
                <s.icon size={24} />
              </div>
            </div>
          ))}
        </section>

        {/* HEADER DE ACCIONES */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-10">
          <div className="w-full lg:w-auto">
            <h2 className="text-4xl font-black tracking-tight mb-4">Gestión de Catálogo</h2>
            <div className="flex flex-wrap gap-2">
              {["All", "Software", "Gaming", "Security", "Tools"].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all border ${activeCategory === cat
                      ? "bg-white text-black border-white shadow-lg shadow-white/10"
                      : "bg-slate-900/50 text-slate-500 border-slate-800 hover:border-slate-600"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input
                type="text" placeholder="Filtrar por nombre..."
                className="w-full bg-slate-900/80 border border-slate-800 p-4 pl-12 rounded-2xl outline-none focus:border-blue-500/50 transition-all font-medium"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => { setEditingApp(null); setIsModalOpen(true); }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <Plus size={20} /> NUEVO REGISTRO
            </button>
          </div>
        </div>

        {/* GRID DE RESULTADOS */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="h-[400px] bg-slate-900/40 rounded-[2.5rem] border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredApps.map((app) => (
              <div key={app.id} className="group relative bg-[#0b0f1a] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-blue-500/40 transition-all duration-500 flex flex-col shadow-2xl">
                {/* Visualizer */}
                <div className="aspect-video w-full bg-[#151b2b] relative overflow-hidden">
                  {app.image_url ? (
                    <img src={app.image_url} alt={app.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-800">
                      <ImageIcon size={64} className="mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">No Asset Found</span>
                    </div>
                  )}
                  <div className="absolute top-5 left-5">
                    <Badge variant="info">{app.category}</Badge>
                  </div>
                  <div className="absolute bottom-5 right-5 bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-lg text-xs font-black text-white">
                    VER {app.version}
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-black tracking-tight truncate pr-4">{app.name}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingApp(app); setIsModalOpen(true); }} className="p-3 bg-white/5 hover:bg-blue-600/20 text-blue-400 rounded-xl transition-all">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => deleteApp(app.id)} className="p-3 bg-white/5 hover:bg-red-600/20 text-red-500 rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 line-clamp-3">
                    {app.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${app.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="text-[10px] font-black uppercase text-slate-600 tracking-tighter">{app.status}</span>
                    </div>
                    <a href={app.download_url} target="_blank" className="flex items-center gap-2 text-blue-500 hover:text-white font-black text-[10px] uppercase tracking-widest transition-colors">
                      Documentación <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredApps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 border border-dashed border-slate-800 rounded-[3rem] bg-slate-900/10">
            <Search size={64} className="text-slate-800 mb-6" />
            <h3 className="text-xl font-bold text-slate-500">No se encontraron registros en este sector</h3>
            <button onClick={() => { setSearchTerm(""); setActiveCategory("All"); }} className="mt-4 text-blue-500 font-bold hover:underline">Reiniciar Filtros</button>
          </div>
        )}
      </div>

      {/* MODAL MAESTRO */}
      {isModalOpen && (
        <AppModal
          app={editingApp}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => { setIsModalOpen(false); loadData(); }}
        />
      )}
    </div>
  );
}

// --- MODAL DE ALTA DEFINICIÓN ---

function AppModal({ app, onClose, onSaved }: { app: Application | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(app?.image_url || null);
  const [formData, setFormData] = useState({
    name: app?.name || "",
    description: app?.description || "",
    version: app?.version || "1.0.0",
    category: app?.category || "Software",
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

      // Proceso de subida de archivos (REFORZADO)
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: upError } = await supabase.storage
          .from('APP-IMAGES')
          .upload(fileName, file, { upsert: true });

        if (upError) throw new Error('Storage Error: ' + upError.message);

        const { data: urlData } = supabase.storage.from('APP-IMAGES').getPublicUrl(fileName);
        finalImageUrl = urlData.publicUrl;
      }

      const payload = {
        ...formData,
        image_url: finalImageUrl,
        updated_at: new Date().toISOString()
      };

      if (app) {
        const { error } = await supabase.from('applications').update(payload).eq('id', app.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('applications').insert([payload]);
        if (error) throw error;
      }

      onSaved();
    } catch (err: any) {
      alert("ERROR CRÍTICO: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 z-[200] overflow-y-auto">
      <div className="bg-[#0c111d] border border-white/10 w-full max-w-3xl rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase">{app ? 'Actualizar Nodo' : 'Inyectar Registro'}</h2>
            <p className="text-xs text-slate-500 font-bold tracking-widest mt-1 uppercase italic">Protocolo {app ? 'Update' : 'Insert'}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-slate-500 hover:text-white">
            <X size={28} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Lado Izquierdo: Datos */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre del Activo</label>
              <input required className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold"
                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Versión</label>
                <input required className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold"
                  value={formData.version} onChange={e => setFormData({ ...formData, version: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Estado</label>
                <select className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold appearance-none"
                  value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="deprecated">Deprecated</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoría de Sistema</label>
              <select className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold appearance-none"
                value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as AppCategory })}
              >
                <option value="Software">Software</option>
                <option value="Gaming">Gaming</option>
                <option value="Security">Security</option>
                <option value="Network">Network</option>
                <option value="Tools">Tools</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">URL Fuente de Descarga</label>
              <input required type="url" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold"
                value={formData.download_url} onChange={e => setFormData({ ...formData, download_url: e.target.value })}
              />
            </div>
          </div>

          {/* Lado Derecho: Asset & Desc */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Iconografía del Nodo</label>
              <div className="relative aspect-[16/10] bg-white/5 border-2 border-dashed border-white/10 rounded-[2rem] overflow-hidden group hover:border-blue-500/50 transition-all cursor-pointer">
                {preview ? (
                  <img src={preview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600">
                    <ImageIcon size={48} className="mb-2" />
                    <p className="text-[10px] font-black uppercase italic">Esperando Asset...</p>
                  </div>
                )}
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                <div className="absolute inset-0 bg-blue-600/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="font-black text-xs uppercase tracking-widest">Cambiar Imagen</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descripción de Funciones</label>
              <textarea required className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl h-[124px] outline-none focus:border-blue-500 transition-all font-bold resize-none"
                value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-5 font-black text-slate-500 hover:text-white transition-all uppercase tracking-[0.2em] text-[11px]">
              Cancelar Operación
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-[2] bg-blue-600 hover:bg-blue-500 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-2xl shadow-blue-900/30 uppercase tracking-[0.2em] text-[11px]"
            >
              {saving ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
              {saving ? 'Procesando Núcleo...' : 'Sincronizar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}