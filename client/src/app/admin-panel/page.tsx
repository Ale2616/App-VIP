"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import {
  Plus, Pencil, Trash2, ExternalLink, Loader2, Download,
  Image as ImageIcon, X, Search, AlertTriangle, Globe,
  CheckCircle2, Database, Zap, ArrowLeft, Crown, Check,
  Sparkles, AppWindow, Gamepad2, Bot, Users, Shield, Mail,
  Settings, ImagePlus, Monitor, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import BulkUploader from "@/components/BulkUploader";
import BulkUpload from "@/components/BulkUpload";
import CsvLinkUpdater from "@/components/CsvLinkUpdater";
import BulkDeleter from "@/components/BulkDeleter";
import RoleSelector from "@/components/RoleSelector";

const SYSTEM_CONFIG = {
  BUCKET_NAME: "app-images",
  TABLE_NAME: "applications",
};

interface DownloadOptionItem {
  id: string;
  title: string;
  version: string;
  size: string;
  url: string;
}

interface Application {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  download_url: string;
  image_url: string;
  icon_url?: string;
  screenshots?: string[];
  download_options?: DownloadOptionItem[];
  is_premium?: boolean;
  score?: string;
  installs?: string;
  created_at: string;
  updated_at?: string;
  mod?: string | null;
  content_rating?: string | null;
}

const checkCategoryGroup = (appCategory: string, group: string) => {
  const appCat = (appCategory || "").toLowerCase().trim();
  const target = group.toLowerCase().trim();

  if (target === "todos") return true;
  if (target === "aplicaciones" || target === "aplicacion" || target === "aplicación") {
    return ["app", "apps", "aplicación", "aplicacion", "aplicaciones"].includes(appCat);
  }
  if (target === "juegos" || target === "juego") {
    return ["juego", "juegos", "game"].includes(appCat) && !appCat.includes("pc");
  }
  if (target === "juegos pc" || target === "juego pc") {
    return ["juego pc", "juegos pc"].includes(appCat);
  }
  if (target === "software pc" || target === "software") {
    return ["software", "software pc", "programas"].includes(appCat);
  }
  return appCat === target;
};

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
  const [activeTab, setActiveTab] = useState<"apps" | "usuarios" | "bulk" | "bulk-json" | "bulk-links" | "bulk-delete" | "membresias">("apps");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ── Logo del sitio ──
  const [siteLogoUrl, setSiteLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => { fetchData(); fetchUsers(); fetchSiteLogo(); }, []);

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

  const fetchSiteLogo = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("logo_url")
        .eq("id", 1)
        .single();
      if (!error && data?.logo_url) {
        setSiteLogoUrl(data.logo_url);
      }
    } catch {
      // Table might not exist yet — silent
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona únicamente un archivo de imagen (PNG, JPG, WEBP).');
      e.target.value = '';
      return;
    }

    setUploadingLogo(true);
    try {
      console.log("📤 Subiendo logo al bucket:", SYSTEM_CONFIG.BUCKET_NAME);

      // 1. Subir imagen al storage
      const ext = file.name.split(".").pop() || "png";
      const fileName = `logo-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(SYSTEM_CONFIG.BUCKET_NAME)
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error("❌ Storage error:", uploadError);
        throw new Error("Error al subir imagen: " + (uploadError.message || JSON.stringify(uploadError)));
      }

      const { data: urlData } = supabase.storage
        .from(SYSTEM_CONFIG.BUCKET_NAME)
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log("✅ Imagen subida:", publicUrl);

      // 2. Guardar URL en site_settings (id=1)
      const { error: updateError } = await supabase
        .from("site_settings")
        .update({ logo_url: publicUrl })
        .eq("id", 1);

      if (updateError) {
        console.warn("⚠️ Update falló, intentando insert:", updateError.message);
        const { error: insertError } = await supabase
          .from("site_settings")
          .insert({ id: 1, logo_url: publicUrl });

        if (insertError) {
          console.error("❌ DB error:", insertError);
          throw new Error("Error guardando en BD: " + (insertError.message || JSON.stringify(insertError)));
        }
      }

      console.log("✅ Logo guardado en site_settings");
      setSiteLogoUrl(publicUrl);
      setNotification({ msg: "¡Logotipo actualizado exitosamente!", type: "success" });
    } catch (err: any) {
      console.error("❌ Error completo en handleLogoUpload:", err);
      alert("Error al subir logo: " + (err?.message || "Error desconocido"));
      setNotification({ msg: "Error: " + (err?.message || "Error desconocido"), type: "error" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const ROLE_CYCLE: Record<string, string> = { user: "vip", vip: "elite", elite: "admin", admin: "user" };
  const ROLE_LABELS: Record<string, string> = { user: "Usuario", vip: "VIP Premium", elite: "VIP Élite", admin: "Administrador" };

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = ROLE_CYCLE[currentRole] || "user";
    const label = ROLE_LABELS[newRole] || newRole;
    if (!confirm(`¿Cambiar rol de este usuario a "${label}"?`)) return;
    try {
      const res = await fetch("/api/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = json?.error || "Error desconocido al cambiar el rol";
        console.error("❌ /api/set-role error:", json);
        alert("❌ Error al cambiar el rol:\n" + msg);
        throw new Error(msg);
      }

      setNotification({
        msg: `Rol actualizado a ${label}`,
        type: "success",
      });
      fetchUsers();
    } catch (err: any) {
      setNotification({ msg: err.message, type: "error" });
    }
  };

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = checkCategoryGroup(app.category, activeCategory);
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
    { key: "Aplicaciones", label: "Aplicaciones", icon: AppWindow, gradient: "from-blue-500 to-cyan-500" },
    { key: "Juegos", label: "Juegos", icon: Gamepad2, gradient: "from-amber-500 to-orange-500" },
    { key: "Juegos PC", label: "Juegos PC", icon: Monitor, gradient: "from-indigo-500 to-violet-500" },
    { key: "Software PC", label: "Software PC", icon: Monitor, gradient: "from-teal-500 to-emerald-500" },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-sans antialiased relative overflow-x-hidden transition-colors duration-300">
      {/* Orbes decorativos */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 rounded-full blur-3xl dark:from-purple-500/20 dark:to-fuchsia-500/20" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl dark:from-blue-500/10 dark:to-cyan-500/10" />
      </div>

      {/* Notificación */}
      {notification && (
        <div className={`fixed top-5 right-5 left-5 sm:left-auto z-[999] flex items-center gap-3 px-5 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-500 ${
          notification.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
        }`}>
          {notification.type === "success" ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertTriangle size={18} className="shrink-0" />}
          <p className="font-semibold text-sm min-w-0 break-words">{notification.msg}</p>
        </div>
      )}

      {/* Header sticky */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-955/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            {siteLogoUrl ? (
              <Image
                src={siteLogoUrl}
                alt="Logo del sitio"
                width={40}
                height={40}
                className="object-contain rounded-md shadow-lg shadow-purple-500/10"
                priority
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center rounded-xl font-bold text-xs shadow-lg shadow-purple-500/20">VIP</div>
            )}
            <span className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">App VIP</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
              <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">Panel Pro</span>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
        {/* Título y controles */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-purple-650 dark:text-purple-400" />
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Administración</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-1">
              <span className="bg-gradient-to-r from-gray-950 via-purple-700 to-gray-950 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent">Panel Administrativo</span>
            </h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm md:text-base">Gestiona tu catálogo y usuarios</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
              <input
                type="text" placeholder="Buscar..."
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-white dark:bg-slate-900/85 border border-gray-200 dark:border-slate-700/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm shadow-sm"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => { setEditingApp(null); setIsModalOpen(true); }}
              className="h-11 bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 text-white px-5 rounded-xl font-bold shadow-md hover:shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 active:scale-[0.97] transition-all cursor-pointer text-sm"
            >
              <Plus size={18} strokeWidth={2.5} /> Nueva App
            </button>
          </div>
        </div>

        {/* ═══ CONFIGURACIÓN DEL SITIO (Modo Claro/Oscuro dinámico) ═══ */}
        <div className="mb-8 p-5 rounded-2xl bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 shadow-md">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Configuración del Sitio</h2>
              <p className="text-xs text-amber-700 dark:text-amber-300/70">Cambia el logotipo global de la página</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
            {/* Preview del logo */}
            <div className="shrink-0">
              {siteLogoUrl ? (
                <img
                  src={siteLogoUrl}
                  alt="Logo actual"
                  className="w-20 h-20 rounded-2xl object-contain shadow-md border border-gray-200 dark:border-amber-500/20 bg-gray-50 dark:bg-slate-900/80 p-1.5"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gray-50 dark:bg-slate-900/80 border-2 border-dashed border-gray-300 dark:border-slate-700 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-400 dark:text-slate-650">VIP</span>
                </div>
              )}
            </div>

            {/* Input de archivo */}
            <div className="flex-1 space-y-2 w-full">
              <label className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <ImagePlus className="w-4 h-4 text-amber-500" />
                Subir nuevo logotipo
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="w-full min-w-0 text-sm text-gray-750 dark:text-slate-300 bg-white dark:bg-slate-900/80 border border-gray-200 dark:border-slate-700/50 rounded-xl px-3 py-2.5 cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-black file:cursor-pointer hover:file:bg-amber-400 transition-all"
                />
                {uploadingLogo && (
                  <Loader2 className="w-5 h-5 text-amber-500 animate-spin shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-slate-500">
                Recomendado: imagen cuadrada 200×200 px (PNG o SVG)
              </p>
              {siteLogoUrl && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400/80 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Logo activo — se muestra en toda la web
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs principales: Apps vs Usuarios vs Subida Masiva vs Actualizar Enlaces */}
        <div className="flex gap-2 mb-8 border-b border-gray-250 dark:border-slate-800/50 pb-4 overflow-x-auto">
          <button onClick={() => setActiveTab("apps")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === "apps" ? "bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white shadow-md" : "bg-white dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-850 hover:border-gray-300 dark:hover:border-slate-700"}`}>
            <AppWindow className="w-4 h-4" /> Aplicaciones
          </button>
          <button onClick={() => setActiveTab("usuarios")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === "usuarios" ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md" : "bg-white dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-850 hover:border-gray-300 dark:hover:border-slate-700"}`}>
            <Users className="w-4 h-4" /> Usuarios
          </button>
          <button onClick={() => setActiveTab("bulk")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === "bulk" ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md" : "bg-white dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-850 hover:border-gray-300 dark:hover:border-slate-700"}`}>
            <Zap className="w-4 h-4" /> Subida Masiva
          </button>
          <button onClick={() => setActiveTab("bulk-json")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === "bulk-json" ? "bg-gradient-to-r from-indigo-500 to-fuchsia-600 text-white shadow-md" : "bg-white dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-850 hover:border-gray-300 dark:hover:border-slate-700"}`}>
            <Zap className="w-4 h-4" /> Subida Masiva JSON
          </button>
          <button onClick={() => setActiveTab("bulk-links")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === "bulk-links" ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md" : "bg-white dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-850 hover:border-gray-300 dark:hover:border-slate-700"}`}>
            <RefreshCw className="w-4 h-4" /> Actualizar Enlaces
          </button>
          <button onClick={() => setActiveTab("bulk-delete")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === "bulk-delete" ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md" : "bg-white dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-850 hover:border-gray-300 dark:hover:border-slate-700"}`}>
            <Trash2 className="w-4 h-4" /> Eliminar Masivamente
          </button>
          <button onClick={() => setActiveTab("membresias")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === "membresias" ? "bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white shadow-md" : "bg-white dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-850 hover:border-gray-300 dark:hover:border-slate-700"}`}>
            <Crown className="w-4 h-4" /> Gestión de Membresías
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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all duration-300 text-sm font-bold cursor-pointer ${
                  isActive
                    ? `bg-gradient-to-r ${cat.gradient} text-white shadow-md`
                    : "bg-white dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-850 hover:border-gray-300 dark:hover:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50"
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: "Total", value: apps.length, gradient: "from-purple-500 to-fuchsia-500", icon: AppWindow },
            { label: "Aplicaciones", value: apps.filter(a => checkCategoryGroup(a.category, "Aplicaciones")).length, gradient: "from-blue-500 to-cyan-500", icon: AppWindow },
            { label: "Juegos", value: apps.filter(a => checkCategoryGroup(a.category, "Juegos")).length, gradient: "from-amber-500 to-orange-500", icon: Gamepad2 },
            { label: "Juegos PC", value: apps.filter(a => checkCategoryGroup(a.category, "Juegos PC")).length, gradient: "from-indigo-500 to-violet-500", icon: Monitor, hidden: true },
            { label: "Software PC", value: apps.filter(a => checkCategoryGroup(a.category, "Software PC")).length, gradient: "from-teal-500 to-emerald-500", icon: Monitor, hidden: true }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-slate-900/50 border border-gray-250/60 dark:border-slate-800/50 shadow-sm ${stat.hidden ? "hidden md:flex" : ""}`}>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient}`}><Icon className="w-4 h-4 text-white" /></div>
                <div><p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p><p className="text-[11px] text-gray-400 dark:text-slate-500 font-semibold">{stat.label}</p></div>
              </div>
            );
          })}
        </div>

        {/* Grilla de tarjetas */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="h-72 bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900/50">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 flex items-center justify-center">
              <Database size={28} className="text-gray-400 dark:text-slate-700" />
            </div>
            <p className="text-gray-800 dark:text-slate-400 font-bold mb-1">No se encontraron resultados</p>
            <p className="text-gray-500 dark:text-slate-600 text-xs">Intenta con otro término o categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="group bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-gray-200 dark:border-slate-800/50 rounded-2xl overflow-hidden transition-all duration-300 hover:border-purple-550/30 hover:shadow-lg dark:hover:shadow-purple-500/10 shadow-sm"
              >
                {/* Imagen */}
                <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-slate-900">
                  {(app.icon_url || app.image_url) ? (
                    <img
                      src={`${app.icon_url || app.image_url}?t=${new Date(app.updated_at || app.created_at).getTime()}`}
                      alt={app.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-750"><ImageIcon size={36} className="text-gray-300 dark:text-slate-700" /></div>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider text-purple-300 border border-purple-500/20 uppercase shadow-sm">
                      {app.category}
                    </span>
                    {app.is_premium && (
                      <span className="bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1 shadow-md">
                        <Crown size={10} /> VIP
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-gradient-to-r from-purple-500 to-fuchsia-600 px-2.5 py-0.5 rounded-md text-[11px] font-bold text-white shadow-md">
                    v{app.version}
                  </div>
                </div>

                {/* Cuerpo */}
                <div className="p-5">
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-1.5">{app.name}</h3>
                  <p className="text-gray-650 dark:text-slate-400 text-sm leading-relaxed line-clamp-2 mb-5">{app.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-150 dark:border-slate-800/50">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => { setEditingApp(app); setIsModalOpen(true); }}
                        className="p-2 bg-gray-100 dark:bg-slate-800/50 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-650 dark:text-purple-400 rounded-lg transition-all cursor-pointer" title="Editar"
                      ><Pencil size={15} /></button>
                      <button
                        onClick={() => deleteApp(app.id)}
                        className="p-2 bg-gray-100 dark:bg-slate-800/50 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 dark:text-red-400 rounded-lg transition-all cursor-pointer" title="Eliminar"
                      ><Trash2 size={15} /></button>
                    </div>
                    <a href={app.download_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-gray-500 hover:text-purple-600 dark:text-slate-500 dark:hover:text-purple-400 font-bold text-xs transition-colors">
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
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Users className="w-5 h-5 text-amber-500" /> Usuarios registrados</h2>
              <span className="text-xs text-gray-500 dark:text-slate-500 font-bold">{users.length} usuarios</span>
            </div>

            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                <Users size={40} className="text-gray-400 dark:text-slate-700 mb-3" />
                <p className="text-gray-500 dark:text-slate-500 text-sm font-medium">No hay usuarios registrados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-gray-200 dark:border-slate-800/50 rounded-xl hover:border-purple-550/20 shadow-sm transition-all">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg shrink-0 ${
                      user.role === "SUPER_ADMIN" || user.role === "admin"
                        ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/20"
                        : user.role === "EDITOR"
                        ? "bg-gradient-to-br from-blue-500 to-indigo-550 shadow-blue-500/20"
                        : user.role === "VIP_PREMIUM" || user.role === "elite"
                        ? "bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-purple-500/20"
                        : user.role === "VIP_ESTANDAR" || user.role === "vip"
                        ? "bg-gradient-to-br from-indigo-500 to-purple-500 shadow-indigo-500/20"
                        : "bg-gradient-to-br from-slate-500 to-slate-600 shadow-slate-500/20"
                    }`}>
                      {user.role === "SUPER_ADMIN" || user.role === "admin" ? (
                        <Crown className="w-4 h-4 text-white" />
                      ) : user.role === "EDITOR" ? (
                        <Pencil className="w-4 h-4 text-white" />
                      ) : user.role === "VIP_PREMIUM" || user.role === "elite" || user.role === "VIP_ESTANDAR" || user.role === "vip" ? (
                        <Sparkles className="w-4 h-4 text-white" />
                      ) : (
                        <Users className="w-4 h-4 text-white" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name || "Sin nombre"}</p>
                        {user.role !== "user" && user.role !== "FREE_USER" && (
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            user.role === "SUPER_ADMIN" || user.role === "admin" ? "text-amber-600 bg-amber-500/10 border border-amber-500/20"
                            : user.role === "EDITOR" ? "text-blue-600 bg-blue-500/10 border border-blue-500/20"
                            : user.role === "VIP_PREMIUM" || user.role === "elite" ? "text-purple-600 bg-purple-500/10 border border-purple-500/20"
                            : "text-indigo-600 bg-indigo-500/10 border border-indigo-500/20"
                          }`}>{
                            user.role === "SUPER_ADMIN" || user.role === "admin" ? "Admin" :
                            user.role === "EDITOR" ? "Editor" :
                            user.role === "VIP_PREMIUM" || user.role === "elite" ? "VIP Premium" :
                            "VIP Estándar"
                          }</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-500 flex items-center gap-1.5 mt-0.5 truncate font-semibold">
                        <Mail className="w-3 h-3" /> {user.email}
                      </p>
                    </div>

                    {/* Gestor de Roles */}
                    <RoleSelector
                      userId={user.id}
                      currentRole={user.role}
                      onRoleUpdated={() => fetchUsers()}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN SUBIDA MASIVA */}
        {activeTab === "bulk" && (
          <div className="max-w-2xl mx-auto">
            <BulkUploader />
          </div>
        )}

        {/* SECCIÓN SUBIDA MASIVA JSON */}
        {activeTab === "bulk-json" && (
          <div className="max-w-2xl mx-auto">
            <BulkUpload />
          </div>
        )}

        {/* SECCIÓN ACTUALIZAR ENLACES */}
        {activeTab === "bulk-links" && (
          <div className="max-w-2xl mx-auto">
            <CsvLinkUpdater />
          </div>
        )}

        {/* SECCIÓN ELIMINAR MASIVAMENTE */}
        {activeTab === "bulk-delete" && (
          <div className="max-w-2xl mx-auto">
            <BulkDeleter />
          </div>
        )}

        {/* SECCIÓN GESTIÓN DE MEMBRESÍAS VIP */}
        {activeTab === "membresias" && (
          <div className="w-full">
            <MembresiasTab />
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
// COMPONENTE MODAL (Modo Claro/Oscuro dinámico)
// ==========================================

type ScreenshotItem = { id: string; file?: File; url: string; };

function AppModal({ app, onClose, onSaved }: { app: Application | null; onClose: () => void; onSaved: () => void }) {
  const { isAdmin } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(app?.icon_url || app?.image_url || null);
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>(
    (app?.screenshots || []).map(url => ({ id: url, url }))
  );

  const formatInitialInstalls = (val?: string) => {
    if (!val) return "";
    const cleanDigits = val.replace(/\D/g, "");
    if (!cleanDigits) return val;
    const parsed = parseInt(cleanDigits, 10);
    return isNaN(parsed) ? val : parsed.toLocaleString("es-ES");
  };

  const [formData, setFormData] = useState({
    name: app?.name || "",
    description: app?.description || "",
    version: app?.version || "1.0.0",
    category: app?.category || "Aplicación",
    download_url: app?.download_url || "",
    image_url: app?.image_url || "",
    is_premium: app?.is_premium || false,
    score: app?.score || "",
    installs: formatInitialInstalls(app?.installs || ""),
    mod: app?.mod || "",
    content_rating: app?.content_rating || "3+",
  });

  const handleInstallsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const lower = rawValue.trim().toLowerCase();
    
    if (lower.endsWith("k") || lower.endsWith("m") || lower.endsWith("b")) {
      const suffix = lower.slice(-1);
      const numPart = lower.slice(0, -1).trim();
      const num = parseFloat(numPart.replace(/,/g, "."));
      if (!isNaN(num)) {
        let multiplier = 1;
        if (suffix === "k") multiplier = 1000;
        if (suffix === "m") multiplier = 1000000;
        if (suffix === "b") multiplier = 1000000000;
        
        const calculated = Math.round(num * multiplier);
        setFormData(prev => ({ ...prev, installs: calculated.toLocaleString("es-ES") }));
        return;
      }
    }

    const cleanDigits = rawValue.replace(/\D/g, "");
    if (cleanDigits === "") {
      setFormData(prev => ({ ...prev, installs: "" }));
      return;
    }
    
    const parsed = parseInt(cleanDigits, 10);
    if (!isNaN(parsed)) {
      setFormData(prev => ({ ...prev, installs: parsed.toLocaleString("es-ES") }));
    } else {
      setFormData(prev => ({ ...prev, installs: rawValue }));
    }
  };

  // ── Scraper / Autocompletar ──
  const [scraperAppId, setScraperAppId] = useState("");
  const [scraperLoading, setScraperLoading] = useState(false);
  const [scraperError, setScraperError] = useState<string | null>(null);

  const handleAutoComplete = async () => {
    const id = scraperAppId.trim();
    if (!id) return;
    setScraperLoading(true);
    setScraperError(null);
    try {
      const res = await fetch("/api/admin/scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error desconocido");

      const ratingRaw = json.contentRating || "";
      let ratingFormatted = "3+";
      if (ratingRaw) {
        const numMatch = ratingRaw.match(/\d+/);
        if (numMatch) {
          ratingFormatted = `${numMatch[0]}+`;
        } else {
          const lower = ratingRaw.toLowerCase();
          if (lower.includes("everyone")) ratingFormatted = "3+";
          else if (lower.includes("teen")) ratingFormatted = "12+";
          else if (lower.includes("mature")) ratingFormatted = "17+";
          else if (lower.includes("adult")) ratingFormatted = "18+";
          else ratingFormatted = ratingRaw;
        }
      }

      setFormData(prev => ({
        ...prev,
        name: json.title || prev.name,
        description: json.description || prev.description,
        score: json.scoreText || (json.score !== undefined ? String(json.score) : prev.score),
        installs: json.installs ? formatInitialInstalls(json.installs) : prev.installs,
        content_rating: ratingFormatted,
      }));

      if (json.icon) {
        setPreview(json.icon);
        setFile(null);
      }

      if (json.screenshots && json.screenshots.length > 0) {
        const scraped: ScreenshotItem[] = json.screenshots.map((url: string) => ({
          id: `scraper-${Math.random().toString(36).substring(7)}`,
          url,
        }));
        setScreenshots(scraped);
      }
    } catch (err: any) {
      setScraperError(err.message || "Error al buscar la app");
    } finally {
      setScraperLoading(false);
    }
  };

  const genId = () => {
    try { return crypto.randomUUID(); } catch { return `opt-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
  };

  const [downloadOptions, setDownloadOptions] = useState<DownloadOptionItem[]>(
    (app?.download_options || []).map((opt) => ({
      id: genId(),
      title: opt.title ?? "",
      version: opt.version ?? "",
      size: opt.size ?? "",
      url: opt.url ?? "",
    }))
  );

  const addDownloadOption = () => {
    setDownloadOptions(prev => [
      ...prev,
      { id: genId(), title: "", version: "", size: "", url: "" },
    ]);
  };

  const removeDownloadOption = (id: string) => {
    setDownloadOptions(prev => prev.filter(o => o.id !== id));
  };

  const updateDownloadOption = (index: number, field: keyof Omit<DownloadOptionItem, "id">, value: string) => {
    setDownloadOptions(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      alert('Por favor, selecciona únicamente un archivo de imagen (PNG, JPG, WEBP).');
      e.target.value = '';
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length < files.length) {
      alert('Algunos archivos no son imágenes y fueron descartados. Solo se aceptan PNG, JPG, WEBP.');
    }
    if (imageFiles.length === 0) {
      e.target.value = '';
      return;
    }
    const newItems = imageFiles.map(f => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      url: URL.createObjectURL(f)
    }));
    setScreenshots(prev => [...prev, ...newItems]);
  };

  const removeScreenshot = (id: string) => {
    setScreenshots(prev => prev.filter(s => s.id !== id));
  };

  const handleUpload = async (fileToUpload: File): Promise<string> => {
    const fileExt = fileToUpload.name.split(".").pop() || "png";
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    console.log(`📤 Subiendo "${fileToUpload.name}" al bucket "${SYSTEM_CONFIG.BUCKET_NAME}" como "${fileName}"...`);

    const { error: uploadError } = await supabase.storage
      .from(SYSTEM_CONFIG.BUCKET_NAME)
      .upload(fileName, fileToUpload, { upsert: true });

    if (uploadError) {
      console.error("❌ Error de Storage:", uploadError);
      throw new Error("Error al subir imagen: " + (uploadError.message || JSON.stringify(uploadError)));
    }

    const { data: urlData } = supabase.storage
      .from(SYSTEM_CONFIG.BUCKET_NAME)
      .getPublicUrl(fileName);

    console.log("✅ Imagen subida OK:", urlData.publicUrl);
    return urlData.publicUrl;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      alert("Acceso denegado. Solo administradores pueden guardar o editar aplicaciones.");
      return;
    }

    if (saving) return;
    setSaving(true);

    try {
      let finalIconUrl = app?.icon_url || "";
      if (file) {
        try {
          console.log("📤 Paso 1: Subiendo icono...");
          finalIconUrl = await handleUpload(file);
        } catch (uploadErr: any) {
          console.error("❌ Error subiendo icono:", uploadErr);
          alert("Error al subir el icono: " + uploadErr.message);
          throw uploadErr;
        }
      } else if (preview && preview.startsWith("http") && !file) {
        finalIconUrl = preview;
      }

      const finalScreenshots: string[] = [];
      for (let i = 0; i < screenshots.length; i++) {
        const item = screenshots[i];
        if (item.file) {
          try {
            console.log(`📤 Paso 2: Subiendo captura ${i + 1}/${screenshots.length}...`);
            const uploadedUrl = await handleUpload(item.file);
            finalScreenshots.push(uploadedUrl);
          } catch (scrErr: any) {
            console.error("❌ Error subiendo capturas:", scrErr);
            alert("Error al subir capturas. Se cancela la operación.");
            throw scrErr;
          }
        } else {
          finalScreenshots.push(item.url);
        }
      }

      const cleanedOptions = downloadOptions.map(opt => ({
        title: opt.title.trim(),
        version: opt.version.trim(),
        size: opt.size.trim(),
        url: opt.url.trim(),
      })).filter(opt => opt.title && opt.url);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        version: formData.version.trim(),
        category: formData.category,
        download_url: formData.download_url.trim(),
        image_url: formData.image_url.trim(),
        icon_url: finalIconUrl || null,
        screenshots: finalScreenshots,
        download_options: cleanedOptions,
        is_premium: formData.is_premium,
        score: formData.score.trim() || null,
        installs: formData.installs ? formData.installs.replace(/\./g, "").trim() : null,
        mod: formData.mod.trim() || null,
        content_rating: formData.content_rating || null,
      };

      console.log("📤 Paso 3: Guardando en Supabase...");
      if (app) {
        const { error } = await supabase
          .from(SYSTEM_CONFIG.TABLE_NAME)
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", app.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(SYSTEM_CONFIG.TABLE_NAME)
          .insert([payload]);
        if (error) throw error;
      }

      onSaved();
    } catch (err: any) {
      console.error("❌ Error completo en handleSave:", err);
      alert("Error al guardar: " + (err?.message || "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-[500]">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800/50 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors">
        {/* Header del modal */}
        <div className="px-4 sm:px-7 py-5 border-b border-gray-200 dark:border-slate-800/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-xl">
              {app ? <Pencil className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">{app ? "Editar Aplicación" : "Nueva Aplicación"}</h2>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-bold">Completa todos los campos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-800/50 rounded-xl transition-all text-gray-400 dark:text-slate-500 hover:text-gray-955 dark:hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSave} className="p-4 sm:p-7 overflow-y-auto space-y-6 flex-1 text-gray-900 dark:text-white">
          {/* ═══ AUTOCOMPLETAR DESDE GOOGLE PLAY ═══ */}
          <div className="bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Globe size={14} />
              ID de Google Play (Opcional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="com.whatsapp"
                className="flex-1 bg-gray-100 dark:bg-slate-800 border border-gray-250 dark:border-slate-700/50 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-mono text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600"
                value={scraperAppId}
                onChange={(e) => setScraperAppId(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAutoComplete(); } }}
              />
              <button
                type="button"
                disabled={scraperLoading || !scraperAppId.trim()}
                onClick={handleAutoComplete}
                className="shrink-0 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-sm"
              >
                {scraperLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                {scraperLoading ? "Buscando..." : "Autocompletar"}
              </button>
            </div>
            {scraperError && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-2 flex items-center gap-1.5 font-semibold">
                <AlertTriangle size={12} /> {scraperError}
              </p>
            )}
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1.5">Ingresa el ID del paquete de Google Play para rellenar automáticamente Nombre, Descripción, Logo y Capturas.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
            {/* Izquierda */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block mb-1.5">Nombre</label>
                <input required placeholder="Nombre de la aplicación"
                  className="w-full bg-gray-100 dark:bg-slate-800 border border-gray-250 dark:border-slate-700/50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 text-sm"
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block mb-1.5">Versión</label>
                  <input required placeholder="1.0.0"
                    className="w-full bg-gray-100 dark:bg-slate-800 border border-gray-250 dark:border-slate-700/50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-bold text-gray-900 dark:text-white text-sm"
                    value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block mb-1.5">Categoría</label>
                  <select
                    className="w-full bg-gray-100 dark:bg-slate-800 border border-gray-250 dark:border-slate-700/50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-bold text-gray-900 dark:text-white appearance-none cursor-pointer text-sm"
                    value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                    <option value="Aplicación">Aplicación</option>
                    <option value="Juegos">Juegos</option>
                    <option value="Juegos PC">Juegos PC</option>
                    <option value="Software PC">Software PC</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block mb-1.5">Calificación</label>
                  <input placeholder="4.5"
                    className="w-full bg-gray-100 dark:bg-slate-800 border border-gray-250 dark:border-slate-700/50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-bold text-gray-900 dark:text-white text-sm"
                    value={formData.score} onChange={(e) => setFormData({ ...formData, score: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block mb-1.5">Edad</label>
                  <input placeholder="3+"
                    className="w-full bg-gray-100 dark:bg-slate-800 border border-gray-250 dark:border-slate-700/50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-bold text-gray-900 dark:text-white text-sm"
                    value={formData.content_rating} onChange={(e) => setFormData({ ...formData, content_rating: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block mb-1.5">Descargas</label>
                  <input placeholder="1.000.000"
                    className="w-full bg-gray-100 dark:bg-slate-800 border border-gray-250 dark:border-slate-700/50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-bold text-gray-900 dark:text-white text-sm"
                    value={formData.installs} onChange={handleInstallsChange} />
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                    Leyendo: {formData.installs ? formData.installs : "0"}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block mb-1.5">Descripción del MOD</label>
                <input placeholder="ej. Funciones Premium Desbloqueadas, Dinero ilimitado"
                  className="w-full bg-gray-100 dark:bg-slate-800 border border-gray-250 dark:border-slate-700/50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-bold text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  value={formData.mod} onChange={(e) => setFormData({ ...formData, mod: e.target.value })} />
              </div>

              {/* ── Toggle Solo VIP ── */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-255 dark:border-amber-500/20">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
                    <Crown size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Solo para VIPs</p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 font-semibold">Requiere membresía VIP para descargar</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_premium: !formData.is_premium })}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer ${
                    formData.is_premium
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-amber-500/10"
                      : "bg-gray-350 dark:bg-slate-700"
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
                    formData.is_premium ? "left-[26px]" : "left-0.5"
                  }`} />
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block mb-1.5">URL de Descarga</label>
                <input required type="url" placeholder="https://ejemplo.com/descarga"
                  className="w-full bg-gray-100 dark:bg-slate-800 border border-gray-250 dark:border-slate-700/50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-bold text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  value={formData.download_url} onChange={(e) => setFormData({ ...formData, download_url: e.target.value })} />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block mb-1.5">Descripción</label>
                <textarea required placeholder="Describe la aplicación..."
                  className="w-full bg-gray-100 dark:bg-slate-800 border border-gray-250 dark:border-slate-700/50 p-3.5 rounded-xl h-24 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-semibold resize-none text-sm leading-relaxed text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block mb-1.5">Capturas de pantalla</label>
                <div className="bg-gray-100 dark:bg-slate-800 border-2 border-dashed border-gray-250 dark:border-slate-700/50 p-4 rounded-xl transition-all hover:border-purple-500/40">
                  <div className="grid grid-cols-3 gap-3">
                    {screenshots.map((s) => (
                      <div key={s.id} className="relative aspect-video rounded-lg overflow-hidden group border border-gray-200 dark:border-slate-700">
                        <img src={s.url} alt="Screenshot" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeScreenshot(s.id)} className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="relative aspect-video rounded-lg border-2 border-dashed border-gray-250 dark:border-slate-700 hover:border-purple-500/40 flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                      <Plus className="text-gray-400 dark:text-slate-500 mb-1" size={20} />
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold">Añadir</span>
                      <input type="file" accept="image/*" multiple onChange={handleScreenshotChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Derecha — Imagen */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block mb-1.5">Imagen / Logo (Icono)</label>
                <div className="relative aspect-video bg-gray-100 dark:bg-slate-800 border-2 border-dashed border-gray-250 dark:border-slate-700/50 rounded-2xl overflow-hidden group hover:border-purple-500/40 transition-all cursor-pointer">
                  {preview ? (
                    <img src={preview} alt="Vista previa" className="w-full h-full object-cover pointer-events-none" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-slate-500 pointer-events-none">
                      <div className="p-3 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700/40 mb-2"><ImageIcon size={28} /></div>
                      <p className="text-xs font-bold">Clic para cargar imagen</p>
                    </div>
                  )}
                  <input type="file" accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                    onChange={handleFileChange} />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-600/40 to-fuchsia-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-20 pointer-events-none">
                    <span className="font-extrabold text-xs text-white px-3 py-1.5 rounded-lg bg-black/35">Cambiar Imagen</span>
                  </div>
                </div>
                {file && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-2 flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> {file.name}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block mb-1.5">URL del Banner (Opcional)</label>
                <input type="url" placeholder="https://ejemplo.com/banner.jpg"
                  className="w-full bg-gray-100 dark:bg-slate-800 border border-gray-250 dark:border-slate-700/50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-bold text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} />
              </div>

              <div className="bg-gray-100/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800/50 rounded-xl p-4 space-y-2.5">
                <h4 className="text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                  <Database size={12} /> Configuración
                </h4>
                <div className="space-y-1.5 text-xs text-gray-550 dark:text-slate-400 font-semibold">
                  <div className="flex justify-between"><span>Bucket</span><span className="text-purple-600 dark:text-purple-400 font-mono">app-images</span></div>
                  <div className="flex justify-between"><span>Tabla</span><span className="text-purple-600 dark:text-purple-400 font-mono">applications</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ OPCIONES DE DESCARGA ═══ */}
          <div className="border-t border-gray-200 dark:border-slate-800/50 pt-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-gray-650 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Download size={14} className="text-emerald-500" />
                Opciones de Descarga
              </label>
              <button
                type="button"
                onClick={addDownloadOption}
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-350 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                <Plus size={14} /> Agregar opción
              </button>
            </div>

            {downloadOptions.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-slate-600 italic mb-2">Sin opciones adicionales. Se usará la URL de descarga principal.</p>
            )}

            <div className="space-y-3">
              {downloadOptions.map((opt, idx) => (
                <div key={opt.id} className="bg-gray-100 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800/50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-gray-400 dark:text-slate-500 uppercase">Opción {idx + 1}</span>
                    <button type="button" onClick={() => removeDownloadOption(opt.id)} className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Título (ej. Premium Mod)"
                      className="col-span-2 w-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 p-2.5 rounded-lg text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
                      value={opt.title}
                      onChange={e => updateDownloadOption(idx, "title", e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Versión (ej. v1.0)"
                      className="w-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 p-2.5 rounded-lg text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
                      value={opt.version}
                      onChange={e => updateDownloadOption(idx, "version", e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Tamaño (ej. 105 MB)"
                      className="w-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 p-2.5 rounded-lg text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
                      value={opt.size}
                      onChange={e => updateDownloadOption(idx, "size", e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="URL de descarga (https://...)"
                      className="col-span-2 w-full bg-gray-100 dark:bg-slate-800 border border-gray-250 dark:border-slate-700/50 p-2.5 rounded-lg text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
                      value={opt.url}
                      onChange={e => updateDownloadOption(idx, "url", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-5 border-t border-gray-200 dark:border-slate-800/50">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 font-semibold text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/50 rounded-xl transition-all cursor-pointer text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-[2] bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-md text-sm text-white">
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} className="fill-white" />}
              {saving ? "Guardando..." : "Guardar Aplicación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MembresiasTab() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState<Array<{ text: string; included: boolean }>>([]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*");
      if (!error && data) {
        const sorted = data.sort((a, b) => {
          const order: Record<string, number> = { free: 1, vip: 2, elite: 3 };
          return (order[a.id] || 99) - (order[b.id] || 99);
        });
        setPlans(sorted);
      }
    } catch (err) {
      console.error("Error loading plans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const startEdit = (plan: any) => {
    setEditingPlan(plan);
    setName(plan.name);
    setPrice(plan.price.replace(/[^0-9]/g, ""));
    setDescription(plan.description);
    
    let parsedFeatures: any[] = [];
    if (Array.isArray(plan.features)) {
      parsedFeatures = plan.features;
    } else if (typeof plan.features === "string") {
      try {
        parsedFeatures = JSON.parse(plan.features);
      } catch {
        parsedFeatures = [];
      }
    }
    setFeatures(parsedFeatures);
  };

  const handleAddFeature = () => {
    setFeatures([...features, { text: "", included: true }]);
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, idx) => idx !== index));
  };

  const handleFeatureChange = (index: number, text: string) => {
    const updated = [...features];
    updated[index].text = text;
    setFeatures(updated);
  };

  const handleFeatureToggle = (index: number) => {
    const updated = [...features];
    updated[index].included = !updated[index].included;
    setFeatures(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setSaving(true);

    let formattedPrice = price;
    if (/^\d+$/.test(price)) {
      const parsed = parseInt(price, 10);
      formattedPrice = `$${parsed.toLocaleString("es-CO")} COP`;
    }

    try {
      const { error } = await supabase
        .from("subscription_plans")
        .update({
          name,
          price: formattedPrice,
          description,
          features: JSON.stringify(features),
        })
        .eq("id", editingPlan.id);

      if (error) throw error;
      setEditingPlan(null);
      fetchPlans();
    } catch (err: any) {
      alert("Error guardando plan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Crown className="w-5 h-5 text-purple-550" /> Gestión de Membresías VIP
        </h2>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-650" />
          <p className="text-sm text-slate-450">Cargando planes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-slate-900 border-2 ${
                plan.id === "vip"
                  ? "border-purple-500/40 shadow-purple-500/5 shadow-md"
                  : plan.id === "elite"
                  ? "border-amber-500/40 shadow-amber-500/5 shadow-md"
                  : "border-gray-200 dark:border-slate-800/80"
              } rounded-2xl p-6 flex flex-col justify-between`}
            >
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">{plan.description}</p>
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-4">
                  {plan.price} <span className="text-xs font-normal text-slate-500">{plan.period}</span>
                </div>
                
                <ul className="space-y-2 mb-6">
                  {((Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || "[]")) as any[]).map((feature: any, idx: number) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-gray-650 dark:text-slate-300">
                      {feature.included ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      )}
                      <span className={feature.included ? "" : "line-through text-slate-500"}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => startEdit(plan)}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-550/10 hover:bg-indigo-100 dark:hover:bg-indigo-550/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" /> Editar Plan
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Edición */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setEditingPlan(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-650 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Editar Plan: {editingPlan.name}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                    Nombre del Plan
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                    Precio (COP)
                  </label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ej. 20000"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                    Descripción del Plan
                  </label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">
                      Beneficios
                    </label>
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-lg border border-indigo-500/25 transition-all cursor-pointer"
                    >
                      + Añadir Beneficio
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                    {features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleFeatureToggle(idx)}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-extrabold uppercase shrink-0 transition-colors cursor-pointer ${
                            feature.included
                              ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20"
                              : "bg-red-500/15 text-red-650 border border-red-500/20"
                          }`}
                        >
                          {feature.included ? "Incluido" : "Bloqueado"}
                        </button>
                        <input
                          type="text"
                          required
                          value={feature.text}
                          onChange={(e) => handleFeatureChange(idx, e.target.value)}
                          placeholder="Sin anuncios, descargas ilimitadas..."
                          className="flex-1 h-8 px-2.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/40 text-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {features.length === 0 && (
                      <p className="text-xs text-gray-500 dark:text-slate-500 italic text-center py-2">
                        No hay beneficios configurados.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
