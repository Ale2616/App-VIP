"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  ChevronRight,
  Monitor,
  X
} from "lucide-react";

// Configuración de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface App {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  download_url: string;
  image_url: string;
  created_at: string;
}

export default function AdminPanel() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);

  useEffect(() => {
    getApps();
  }, []);

  async function getApps() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApps(data || []);
    } catch (error: any) {
      alert("Error al cargar datos: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteApp(id: string) {
    if (!confirm("¿Seguro que quieres eliminar esta aplicación?")) return;
    try {
      const { error } = await supabase.from('applications').delete().eq('id', id);
      if (error) throw error;
      getApps();
    } catch (error: any) {
      alert("Error al eliminar: " + error.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Panel Administrativo
            </h1>
            <p className="text-slate-400 mt-2">Gestiona el catálogo de aplicaciones en tiempo real</p>
          </div>
          <button
            onClick={() => { setEditingApp(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 transition-all px-6 py-3 rounded-xl font-bold shadow-lg"
          >
            <Plus size={20} /> Nueva Aplicación
          </button>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p>Sincronizando con el servidor...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => (
              <div key={app.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group hover:border-blue-500/50 transition-all shadow-xl">
                <div className="aspect-video w-full bg-slate-800 relative">
                  {app.image_url ? (
                    <img src={app.image_url} alt={app.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-700">
                      <ImageIcon size={40} />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                    V {app.version}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold mb-1 truncate">{app.name}</h3>
                  <p className="text-slate-400 text-xs line-clamp-2 mb-4 h-8">{app.description}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingApp(app); setIsModalOpen(true); }} className="p-2 bg-slate-800 hover:bg-blue-900/30 text-blue-400 rounded-lg transition-colors">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => deleteApp(app.id)} className="p-2 bg-slate-800 hover:bg-red-900/30 text-red-400 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <a href={app.download_url} target="_blank" className="p-2 text-slate-500 hover:text-white transition-colors">
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <AppModal
          app={editingApp}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => { setIsModalOpen(false); getApps(); }}
        />
      )}
    </div>
  );
}

function AppModal({ app, onClose, onSaved }: { app: App | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: app?.name || "",
    description: app?.description || "",
    version: app?.version || "1.0.0",
    category: app?.category || "Aplicación",
    download_url: app?.download_url || "",
    image_url: app?.image_url || "",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let currentImageUrl = formData.image_url;

      // 1. Subida al Bucket (Mayúsculas obligatorias)
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('APP-IMAGES')
          .upload(fileName, file);

        if (uploadError) throw new Error('Error al subir imagen: ' + uploadError.message);

        const { data: urlData } = supabase.storage.from('APP-IMAGES').getPublicUrl(fileName);
        currentImageUrl = urlData.publicUrl;
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        version: formData.version,
        category: formData.category,
        download_url: formData.download_url,
        image_url: currentImageUrl
      };

      if (app) {
        const { error } = await supabase.from('applications').update(payload).eq('id', app.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('applications').insert([payload]);
        if (error) throw error;
      }

      onSaved();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">{app ? 'Editar App' : 'Nueva App'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Nombre" required
              className="col-span-2 bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:border-blue-500"
              value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            <input
              placeholder="Versión" required
              className="bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:border-blue-500"
              value={formData.version} onChange={e => setFormData({ ...formData, version: e.target.value })}
            />
            <select
              className="bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:border-blue-500"
              value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Aplicación">Aplicación</option>
              <option value="Juego">Juego</option>
              <option value="Herramienta">Herramienta</option>
            </select>
          </div>

          <input
            placeholder="URL de descarga" required type="url"
            className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:border-blue-500"
            value={formData.download_url} onChange={e => setFormData({ ...formData, download_url: e.target.value })}
          />

          <textarea
            placeholder="Descripción" required
            className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl h-24 outline-none focus:border-blue-500"
            value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="bg-slate-800/50 p-4 rounded-xl border border-dashed border-slate-600">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Imagen / Icono</p>
            <input
              type="file" accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white file:font-bold hover:file:bg-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 text-slate-500 font-bold">Cancelar</button>
            <button
              type="submit" disabled={saving}
              className="flex-[2] bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <ChevronRight size={20} />}
              {saving ? 'Procesando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}