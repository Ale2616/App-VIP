import React, { useState } from "react";
import { toast } from "sonner";
import { HelpCircle, Shield, User, Edit, Sparkles } from "lucide-react";

// Mapeo de descripción de beneficios por rol
const ROLE_DESCRIPTIONS: Record<string, string> = {
  SUPER_ADMIN: "Control total del sistema y acceso a configuración crítica.",
  EDITOR: "Gestión de apps y contenido. Sin acceso a usuarios ni finanzas.",
  VIP_PREMIUM: "Catálogo total, descargas ilimitadas y prioridad.",
  VIP_ESTANDAR: "Acceso a catálogo completo, descargas limitadas.",
  FREE_USER: "Acceso restringido, contenido básico.",
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  EDITOR: "Editor",
  VIP_PREMIUM: "VIP Premium",
  VIP_ESTANDAR: "VIP Estándar",
  FREE_USER: "Usuario Free",
};

// Roles antiguos o legados por compatibilidad
const LEGACY_ROLE_MAPPING: Record<string, string> = {
  admin: "SUPER_ADMIN",
  elite: "VIP_PREMIUM",
  vip: "VIP_ESTANDAR",
  user: "FREE_USER",
};

interface RoleSelectorProps {
  userId: string;
  currentRole: string;
  onRoleUpdated?: (newRole: string) => void;
}

export default function RoleSelector({ userId, currentRole, onRoleUpdated }: RoleSelectorProps) {
  // Normalizar rol actual por si viene en formato antiguo
  const initialRole = LEGACY_ROLE_MAPPING[currentRole] || currentRole || "FREE_USER";
  const [role, setRole] = useState(initialRole);
  const [loading, setLoading] = useState(false);

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    setLoading(true);

    try {
      const res = await fetch("/api/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Error al actualizar el rol");
      }

      setRole(newRole);
      toast.success("Rol actualizado con éxito");
      if (onRoleUpdated) {
        onRoleUpdated(newRole);
      }
    } catch (err: any) {
      toast.error(err.message || "Error al cambiar el rol");
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case "SUPER_ADMIN":
        return <Shield className="w-4 h-4 text-amber-500" />;
      case "EDITOR":
        return <Edit className="w-4 h-4 text-blue-400" />;
      case "VIP_PREMIUM":
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case "VIP_ESTANDAR":
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
      <div className="relative flex items-center gap-2">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {getRoleIcon(role)}
        </div>
        <select
          value={role}
          onChange={handleRoleChange}
          disabled={loading}
          className="pl-9 pr-8 py-2 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-950 dark:text-gray-100 border border-gray-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all cursor-pointer disabled:opacity-60 appearance-none min-w-[140px]"
        >
          {Object.entries(ROLE_LABELS).map(([key, label]) => (
            <option key={key} value={key} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
              {label}
            </option>
          ))}
        </select>
        {/* Flecha personalizada */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Tooltip / Texto Informativo dinámico al lado */}
      <div className="relative group flex items-center gap-1.5 bg-gray-100/50 dark:bg-slate-800/40 px-2.5 py-1.5 rounded-md border border-gray-200/50 dark:border-slate-700/30 max-w-xs sm:max-w-md">
        <HelpCircle className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0 cursor-pointer" />
        <span className="text-[11px] text-gray-650 dark:text-slate-400 line-clamp-1 select-none font-medium">
          {ROLE_DESCRIPTIONS[role] || "Selecciona un rol para ver sus beneficios."}
        </span>
        
        {/* Tooltip flotante al pasar el mouse */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-gray-900 dark:bg-slate-950 text-white rounded-lg text-xs shadow-xl border border-gray-800 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 text-center font-medium leading-relaxed">
          <div className="font-bold text-purple-400 mb-1">{ROLE_LABELS[role]}</div>
          {ROLE_DESCRIPTIONS[role]}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-slate-950" />
        </div>
      </div>
    </div>
  );
}
