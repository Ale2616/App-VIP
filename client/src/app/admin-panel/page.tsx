"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase (Asegúrate de que tus variables de entorno estén bien)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Application {
  id: string;
  name: string;
  description: string;
  version: string;
  image_url: string;
  download_url: string;
  created_at: string;
}

export default function AdminPanel() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);

  useEffect(() => {
    fetchApps();
  }, []);

  async function fetchApps() {
    setLoading(true);
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      alert('Error cargando apps: ' + error.message);
    } else {
      setApps(data || []);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (confirm('¿Seguro que quieres eliminar esta app?')) {
      const { error } = await supabase.from('applications').delete().eq('id', id);
      if (error) alert('Error al eliminar: ' + error.message);
      else fetchApps();
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Panel de Control</h1>
        <button
          onClick={() => { setEditingApp(null); setIsModalOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Nueva Aplicación
        </button>
      </div>

      {loading ? (
        <p>Cargando aplicaciones...</p>
      ) : (
        <div className="grid gap-4">
          {apps.map((app) => (
            <div key={app.id} className="border p-4 rounded-lg flex justify-between items-center bg-white shadow-sm">
              <div className="flex items-center gap-4">
                {app.image_url && (
                  <img src={app.image_url} alt={app.name} className="w-12 h-12 rounded object-cover" />
                )}
                <div>
                  <h3 className="font-bold text-lg">{app.name}</h3>
                  <p className="text-sm text-gray-500">Versión: {app.version}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingApp(app); setIsModalOpen(true); }}
                  className="text-blue-600 hover:underline px-2"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(app.id)}
                  className="text-red-600 hover:underline px-2"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <EditModal
          app={editingApp}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => { setIsModalOpen(false); fetchApps(); }}
        />
      )}
    </div>
  );
}

function EditModal({ app, onClose, onSaved }: { app: Application | null, onClose: () => void, onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: app?.name || '',
    description: app?.description || '',
    version: app?.version || '',
    download_url: app?.download_url || '',
    image_url: app?.image_url || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalImageUrl = formData.image_url;

      // 1. Manejo de Imagen (Subida a APP-IMAGES)
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('APP-IMAGES')
          .upload(fileName, file);

        if (uploadError) throw new Error('Error subiendo imagen: ' + uploadError.message);

        const { data: urlData } = supabase.storage.from('APP-IMAGES').getPublicUrl(fileName);
        finalImageUrl = urlData.publicUrl;
      }

      // 2. Guardar en Base de Datos
      const payload = {
        name: formData.name,
        description: formData.description,
        version: formData.version,
        download_url: formData.download_url,
        image_url: finalImageUrl
      };

      if (app) {
        const { error } = await supabase.from('applications').update(payload).eq('id', app.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('applications').insert([payload]);
        if (error) throw error;
      }

      alert('¡Guardado correctamente! 👑');
      onSaved();
    } catch (err: any) {
      alert('Error detectado: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold mb-4">{app ? 'Editar App' : 'Nueva App'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text" placeholder="Nombre de la app" required
            className="w-full border p-2 rounded"
            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            type="text" placeholder="Versión (ej: 1.0.2)" required
            className="w-full border p-2 rounded"
            value={formData.version} onChange={e => setFormData({ ...formData, version: e.target.value })}
          />
          <textarea
            placeholder="Descripción" required
            className="w-full border p-2 rounded h-24"
            value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
          <input
            type="url" placeholder="Link de descarga (Mediafire, Mega, etc.)" required
            className="w-full border p-2 rounded"
            value={formData.download_url} onChange={e => setFormData({ ...formData, download_url: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium mb-1">Imagen / Logo</label>
            <input
              type="file" accept="image/*"
              className="w-full text-sm"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button" onClick={onClose}
              className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar App'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}