"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

interface PanelProProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  onClick?: () => void;
}

export default function PanelPro({ className = "", size = "sm", onClick }: PanelProProps) {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuthStore();

  // Ocultar si el usuario no tiene permisos administrativos
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  const handleNavigate = () => {
    console.log("Clic detectado");
    console.log("Botón presionado");
    if (onClick) {
      onClick();
    }
    router.push("/admin-panel");
  };

  return (
    <Button
      onClick={handleNavigate}
      size={size}
      className={`bg-gradient-to-r from-yellow-400 via-yellow-300 to-amber-500 hover:from-yellow-300 hover:via-yellow-200 hover:to-amber-400 text-yellow-950 font-extrabold shadow-md shadow-yellow-500/40 border border-yellow-200 transition-all cursor-pointer ${className}`}
    >
      <Crown className="w-4 h-4 mr-1" />
      Panel Pro
    </Button>
  );
}
