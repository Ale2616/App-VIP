"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useSiteSettings } from "@/hooks/use-site-settings";
import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import PanelPro from "@/components/PanelPro";
import {
  Menu,
  X,
  Sun,
  Moon,
  Search,
  Crown,
  LogOut,
  User,
  Gamepad2,
  AppWindow,
  Monitor,
  Cpu,
  Home,
  ChevronRight,
  Mail,
  Shield,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

/* ─────────────────────────────────────────────────────────
   Definición de Categorías Reales que usa la base de datos
   ───────────────────────────────────────────────────────── */
const categories = [
  { id: "all" as const, label: "Todos", icon: Home },
  { id: "Aplicaciones" as const, label: "Aplicaciones", icon: AppWindow },
  { id: "Juegos" as const, label: "Juegos", icon: Gamepad2 },
  { id: "Juegos PC" as const, label: "Juegos PC", icon: Monitor },
  { id: "Software PC" as const, label: "Software", icon: Cpu },
  { id: "VIP" as const, label: "VIP", icon: Crown },
];

interface HeaderProps {
  currentCategory: string;
  setCategory: (category: any) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearchClick?: () => void;
}

export default function Header({
  currentCategory,
  setCategory,
  searchTerm,
  setSearchTerm,
  onSearchClick,
}: HeaderProps) {
  const { isAuthenticated, isAdmin, logout, profile } = useAuthStore();
  const { logoUrl } = useSiteSettings();
  const router = useRouter();

  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Cargar y aplicar tema
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      toast.info("Modo oscuro activado");
    } else {
      document.documentElement.classList.remove("dark");
      toast.info("Modo claro activado");
    }
  };

  return (
    <>
      {/* ── Navbar Principal ── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-250/50 dark:border-slate-800/60 shadow-sm transition-colors duration-200">
        <div className="container mx-auto px-4 min-h-[4rem] py-2 lg:py-0 flex flex-wrap items-center justify-between gap-4 w-full">
          
          {/* Lado Izquierdo: Hamburgesa (Móvil) & Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link href="/" className="flex items-center gap-2 group">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="App VIP Logo"
                  className="h-12 w-auto max-w-full h-auto rounded-2xl object-contain shadow-md transition-all duration-300"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center rounded-lg font-bold text-xs shadow-md">
                  VIP
                </div>
              )}
              <span className="text-lg font-extrabold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                App VIP
              </span>
            </Link>
          </div>

          {/* Centro: Categorías PC (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = currentCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                      : "text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </nav>

          {/* Lado Derecho: Buscar, Tema, Usuario */}
          <div className="flex items-center gap-2">
            <SearchBar />

            {/* Toggle Tema Claro/Oscuro */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Alternar tema"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Panel Admin / Pro */}
            <PanelPro className="hidden sm:inline-flex" size="sm" />

            {/* Perfil / Auth */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                    {profile?.name ? profile.name.slice(0, 2).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                </button>

                {showProfile && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden">
                      <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{profile?.name}</p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                          {profile?.role === "SUPER_ADMIN" ? "👑 Super Admin" :
                           profile?.role === "EDITOR" ? "✍️ Editor" :
                           profile?.role === "VIP_PREMIUM" ? "💎 VIP Premium" :
                           profile?.role === "VIP_ESTANDAR" ? "⭐ VIP Estándar" :
                           profile?.role === "admin" ? "👑 Administrador" :
                           profile?.role === "vip" ? "💎 VIP Premium" :
                           profile?.role === "elite" ? "👑 VIP Élite" :
                           "👤 Usuario Free"}
                        </p>
                      </div>
                      <div className="p-3 space-y-2.5">
                        <div className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-slate-300">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate">{profile?.email}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-slate-300">
                          <Shield className="w-3.5 h-3.5" />
                          <span>Rol: {profile?.role}</span>
                        </div>
                        {profile?.created_at && (
                          <div className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-slate-300">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Miembro desde: {new Date(profile.created_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2 border-t border-gray-100 dark:border-slate-700">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full justify-start gap-2 text-xs"
                          onClick={() => {
                            logout();
                            setShowProfile(false);
                            toast.success("Sesión cerrada");
                          }}
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Cerrar Sesión
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Button
                onClick={() => router.push("/login")}
                size="sm"
                className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 cursor-pointer"
              >
                Entrar
              </Button>
            )}
          </div>
        </div>

      </header>

      {/* ── Sidebar / Drawer Móvil ── */}
      {mobileMenuOpen && (
        <>
          {/* Overlay de fondo */}
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menú Lateral */}
          <aside className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-slate-900 z-50 shadow-2xl p-5 flex flex-col justify-between transition-transform duration-300 border-r border-gray-100 dark:border-slate-800">
            <div>
              {/* Header Drawer */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center rounded-lg font-bold text-xs shadow-md">
                    VIP
                  </div>
                  <span className="text-base font-extrabold text-gray-900 dark:text-white">
                    Categorías
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400"
                  aria-label="Cerrar menú"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categorías Lista */}
              <div className="space-y-1">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = currentCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setCategory(cat.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all duration-150 cursor-pointer ${
                        isActive
                          ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                          : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{cat.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-55" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Drawer */}
            <div className="border-t border-gray-100 dark:border-slate-800 pt-4">
              <PanelPro
                className="w-full mb-2"
                size="default"
                onClick={() => setMobileMenuOpen(false)}
              />
              <p className="text-[10px] text-gray-400 dark:text-slate-500 text-center">
                App VIP Premium © {new Date().getFullYear()}
              </p>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
