"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import {
  Plus, Pencil, Trash2, ExternalLink, Loader2,
  Image as ImageIcon, X, Search, AlertTriangle,
  CheckCircle2, Database, Zap, ArrowLeft, Crown,
  Sparkles, AppWindow, Gamepad2, Bot, Users, Shield, Mail
} from "lucide-react";
import Link from "next/link";

const SYSTEM_CONFIG = {
  BUCKET_NAME: "app-images",
  TABLE_NAME: "applications",
};

interface Application {
  id: string;
  name: string;
  description: string;
  version: string;
  category: "Aplicación" | "Juego";
  download_url: string;
  image_url: string;
  created_at: string;
  updated_at?: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminPanel() {
  const { isAdmin } = useAuthStore();
  const [apps, setApps] = useState<Application[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("TODOS");
  const [activeTab, setActiveTab] = useState<"apps" | "usuarios">("apps");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => { fetchData(); fetchUsers(); }, []);

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

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error("Error cargando usuarios:", err.message);
    }
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const action = newRole === "admin" ? "dar permisos de Administrador" : "quitar permisos de Administrador";
    if (!confirm(`¿Seguro que quieres ${action} a este usuario?`)) return;
    try {
      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
      if (error) throw error;
      setNotification({ msg: `Rol actualizado a ${newRole === "admin" ? "Administrador" : "Usuario"}`, type: "success" });
      fetchUsers();
    } catch (err: any) {
      setNotification({ msg: err.message, type: "error" });
    }
  };

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "TODOS" || app.category.toUpperCase() === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [apps, searchTerm, activeCategory]);

  const deleteApp = async (id: string) => {
    if (!isAdmin) {
      setNotification({ msg: "Acceso denegado. Solo administradores pueden eliminar aplicaciones.", type: "error" });
      return;
    }
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

  const categoryFilters = [
    { key: "TODOS", label: "Todos", icon: Sparkles, gradient: "from-purple-500 to-fuchsia-500" },
    { key: "APLICACIÓN", label: "Apps", icon: AppWindow, gradient: "from-blue-500 to-cyan-500" },
    { key: "JUEGO", label: "Juegos", icon: Gamepad2, gradient: "from-amber-500 to-orange-500" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 text-white font-sans antialiased relative">
      {/* Orbes decorativos */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Notificación */}
      {notification && (
        <div className={`fixed top-5 right-5 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-500 ${
          notification.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {notification.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <p className="font-medium text-sm">{notification.msg}</p>
        </div>
      )}

      {/* Header sticky */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-xl shadow-lg shadow-purple-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">App VIP</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-300">Panel Pro</span>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
        {/* Título y controles */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-medium text-purple-300">Administración</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-1">
              <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">Panel Administrativo</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base">Gestiona tu catálogo y usuarios</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text" placeholder="Buscar..."
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-900/80 border border-slate-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => { setEditingApp(null); setIsModalOpen(true); }}
              className="h-11 bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 text-white px-5 rounded-xl font-semibold shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 active:scale-[0.97] transition-all text-sm"
            >
              <Plus size={18} strokeWidth={2.5} /> Nueva App
            </button>
          </div>
        </div>

        {/* Tabs principales: Apps vs Usuarios */}
        <div className="flex gap-2 mb-8 border-b border-slate-800/50 pb-4">
          <button onClick={() => setActiveTab("apps")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === "apps" ? "bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white shadow-lg shadow-purple-500/20" : "bg-slate-900/50 text-slate-400 border border-slate-800 hover:border-slate-700"}`}>
            <AppWindow className="w-4 h-4" /> Aplicaciones
          </button>
          <button onClick={() => setActiveTab("usuarios")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === "usuarios" ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20" : "bg-slate-900/50 text-slate-400 border border-slate-800 hover:border-slate-700"}`}>
            <Users className="w-4 h-4" /> Usuarios
          </button>
        </div>

        {/* Filtros de apps (solo en tab apps) */}
        {activeTab === "apps" && (
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categoryFilters.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all duration-300 text-sm font-medium ${
                  isActive
                    ? `bg-gradient-to-r ${cat.gradient} text-white shadow-lg shadow-purple-500/20`
                    : "bg-slate-900/50 text-slate-400 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
                }`}
              >
                <Icon className="w-4 h-4" /> {cat.label}
              </button>
            );
          })}
        </div>
        )}

        {/* Estadísticas y apps (solo en tab apps) */}
        {activeTab === "apps" && (
        <>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800/50">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500"><AppWindow className="w-4 h-4 text-white" /></div>
            <div><p className="text-xl font-bold text-white">{apps.length}</p><p className="text-[11px] text-slate-500">Total Apps</p></div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800/50">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500"><Gamepad2 className="w-4 h-4 text-white" /></div>
            <div><p className="text-xl font-bold text-white">{apps.filter(a => a.category === "Juego").length}</p><p className="text-[11px] text-slate-500">Juegos</p></div>
          </div>
          <div className="hidden md:flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800/50">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500"><CheckCircle2 className="w-4 h-4 text-white" /></div>
            <div><p className="text-xl font-bold text-white">{apps.filter(a => a.category === "Aplicación").length}</p><p className="text-[11px] text-slate-500">Aplicaciones</p></div>
          </div>
        </div>

        {/* Grilla de tarjetas */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="h-72 bg-slate-900/60 border border-slate-800/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 rounded-2xl border border-dashed border-slate-800/50">
            <div className="w-16 h-16 mb-4 rounded-full bg-slate-900/50 border border-slate-800 flex items-center justify-center">
              <Database size={28} className="text-slate-700" />
            </div>
            <p className="text-slate-400 font-medium mb-1">No se encontraron resultados</p>
            <p className="text-slate-600 text-sm">Intenta con otro término o categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="group bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-2xl overflow-hidden transition-all duration-300 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/10"
              >
                {/* Imagen */}
                <div className="aspect-video relative overflow-hidden bg-slate-900">
                  {app.image_url ? (
                    <img src={app.image_url} alt={app.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="p-4 rounded-2xl bg-slate-800/50"><ImageIcon size={36} className="text-slate-700" /></div>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider text-purple-300 border border-purple-500/20 uppercase">
                    {app.category}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-gradient-to-r from-purple-500 to-fuchsia-600 px-2.5 py-0.5 rounded-md text-[11px] font-bold text-white shadow-lg">
                    v{app.version}
                  </div>
                </div>

                {/* Cuerpo */}
                <div className="p-5">
                  <h3 className="text-base font-semibold text-white truncate group-hover:text-purple-400 transition-colors mb-1.5">{app.name}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-5">{app.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => { setEditingApp(app); setIsModalOpen(true); }}
                        className="p-2 bg-slate-800/50 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-all" title="Editar"
                      ><Pencil size={15} /></button>
                      <button
                        onClick={() => deleteApp(app.id)}
                        className="p-2 bg-slate-800/50 hover:bg-red-500/20 text-red-400 rounded-lg transition-all" title="Eliminar"
                      ><Trash2 size={15} /></button>
                    </div>
                    <a href={app.download_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-slate-500 hover:text-purple-400 font-medium text-xs transition-colors">
                      Ver enlace <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
      )}

        {/* ═══ SECCIÓN USUARIOS ═══ */}
        {activeTab === "usuarios" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-amber-400" /> Usuarios registrados</h2>
              <span className="text-xs text-slate-500 font-medium">{users.length} usuarios</span>
            </div>

            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-slate-800/50">
                <Users size={40} className="text-slate-700 mb-3" />
                <p className="text-slate-500 text-sm">No hay usuarios registrados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center gap-4 p-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-xl hover:border-purple-500/20 transition-all">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg shrink-0 ${
                      user.role === "admin"
                        ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/20"
                        : "bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-purple-500/20"
                    }`}>
                      {user.role === "admin" ? <Crown className="w-4 h-4 text-white" /> : <Users className="w-4 h-4 text-white" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{user.name || "Sin nombre"}</p>
                        {user.role === "admin" && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Admin</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                        <Mail className="w-3 h-3" /> {user.email}
                      </p>
                    </div>

                    {/* Botón toggle rol */}
                    <button
                      onClick={() => toggleRole(user.id, user.role)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        user.role === "admin"
                          ? "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                          : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{user.role === "admin" ? "Quitar Admin" : "Dar Admin"}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <AppModal
          app={editingApp}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => { setIsModalOpen(false); setNotification({ msg: "Aplicación guardada exitosamente", type: "success" }); fetchData(); }}
        />
      )}
    </main>
  );
}

// ==========================================
// COMPONENTE MODAL
// ==========================================

function AppModal({ app, onClose, onSaved }: { app: Application | null; onClose: () => void; onSaved: () => void }) {
  const { isAdmin } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(app?.image_url || null);
  const [formData, setFormData] = useState({
    name: app?.name || "",
    description: app?.description || "",
    version: app?.version || "1.0.0",
    category: app?.category || "Aplicación",
    download_url: app?.download_url || "",
    image_url: app?.image_url || "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("Acceso denegado. Solo administradores pueden guardar o editar aplicaciones.");
      return;
    }
    setSaving(true);
    try {
      let finalImageUrl = formData.image_url;
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from(SYSTEM_CONFIG.BUCKET_NAME).upload(fileName, file);
        if (uploadError) throw new Error("Error al subir imagen: " + uploadError.message);
        const { data: urlData } = supabase.storage.from(SYSTEM_CONFIG.BUCKET_NAME).getPublicUrl(fileName);
        finalImageUrl = urlData.publicUrl;
      }
      const payload = { ...formData, image_url: finalImageUrl };
      if (app) {
        const { error } = await supabase.from(SYSTEM_CONFIG.TABLE_NAME).update(payload).eq("id", app.id);
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-[500]">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/50 w-full max-w-3xl rounded-2xl shadow-2xl shadow-purple-900/20 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header del modal */}
        <div className="px-7 py-5 border-b border-slate-800/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-xl">
              {app ? <Pencil className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{app ? "Editar Aplicación" : "Nueva Aplicación"}</h2>
              <p className="text-xs text-purple-400 font-medium">Completa todos los campos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-800/50 rounded-xl transition-all text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSave} className="p-7 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
            {/* Izquierda */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Nombre</label>
                <input required placeholder="Nombre de la aplicación"
                  className="w-full bg-slate-900/80 border border-slate-700/50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium text-white placeholder:text-slate-600 text-sm"
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Versión</label>
                  <input required placeholder="1.0.0"
                    className="w-full bg-slate-900/80 border border-slate-700/50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium text-slate-300 text-sm"
                    value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Categoría</label>
                  <select
                    className="w-full bg-slate-900/80 border border-slate-700/50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium text-slate-300 appearance-none cursor-pointer text-sm"
                    value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}>
                    <option value="Aplicación">Aplicación</option>
                    <option value="Juego">Juego</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">URL de Descarga</label>
                <input required type="url" placeholder="https://ejemplo.com/descarga"
                  className="w-full bg-slate-900/80 border border-slate-700/50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium text-purple-400 text-sm placeholder:text-slate-600"
                  value={formData.download_url} onChange={(e) => setFormData({ ...formData, download_url: e.target.value })} />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Descripción</label>
                <textarea required placeholder="Describe brevemente la aplicación..."
                  className="w-full bg-slate-900/80 border border-slate-700/50 p-3.5 rounded-xl h-24 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium resize-none text-sm leading-relaxed text-slate-300 placeholder:text-slate-600"
                  value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
            </div>

            {/* Derecha — Imagen */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Imagen / Logo</label>
                <div className="relative aspect-video bg-slate-900/80 border-2 border-dashed border-slate-700/50 rounded-2xl overflow-hidden group hover:border-purple-500/40 transition-all cursor-pointer">
                  {preview ? (
                    <img src={preview} alt="Vista previa" className="w-full h-full object-cover pointer-events-none" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 pointer-events-none">
                      <div className="p-3 rounded-xl bg-slate-800/50 mb-2"><ImageIcon size={28} /></div>
                      <p className="text-xs font-medium">Clic para cargar imagen</p>
                    </div>
                  )}
                  <input type="file" accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                    onChange={handleFileChange} />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-600/40 to-fuchsia-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-20 pointer-events-none">
                    <span className="font-semibold text-xs text-white px-3 py-1.5 rounded-lg bg-black/30">{preview ? "Cambiar Imagen" : "Seleccionar"}</span>
                  </div>
                </div>
                {file && (
                  <p className="text-xs text-purple-400 font-medium mt-2 flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> {file.name}
                  </p>
                )}
              </div>

              <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 space-y-2.5">
                <h4 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Database size={12} /> Configuración
                </h4>
                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex justify-between"><span>Bucket</span><span className="text-purple-400 font-mono font-medium">app-images</span></div>
                  <div className="flex justify-between"><span>Tabla</span><span className="text-purple-400 font-mono font-medium">applications</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-5 border-t border-slate-800/50">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-[2] bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/25 text-sm text-white">
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} className="fill-white" />}
              {saving ? "Guardando..." : "Guardar Aplicación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}