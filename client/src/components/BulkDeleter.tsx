"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function BulkDeleter() {
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [resultSummary, setResultSummary] = useState<{ deletedCount: number } | null>(null);

  const handleDelete = async () => {
    const rawIds = inputText
      .split(/[\n,\s]+/)
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (rawIds.length === 0) {
      toast.error("Por favor ingresa al menos un ID o Nombre de aplicación");
      return;
    }

    const confirmed = window.confirm(
      "¿Estás seguro de que deseas eliminar estas aplicaciones? Esta acción no se puede deshacer"
    );

    if (!confirmed) return;

    setLoading(true);
    setResultSummary(null);
    setStatus(`Eliminando ${rawIds.length} aplicaciones...`);

    try {
      const response = await fetch("/api/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appIds: rawIds }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al realizar la eliminación masiva");
      }

      setResultSummary({ deletedCount: result.deletedCount });
      setStatus("Eliminación completada.");
      toast.success(`Se han eliminado ${result.deletedCount} aplicaciones`);
      setInputText("");
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al conectar con la API de borrado");
      setStatus("Error en la eliminación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-red-50/40 dark:bg-red-950/10 rounded-3xl p-6 sm:p-8 shadow-sm border border-red-200/50 dark:border-red-900/35 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
          <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-red-900 dark:text-red-200">Eliminación Masiva (Bulk Delete)</h2>
          <p className="text-[11px] font-bold text-red-700 dark:text-red-400/80">Zona de Peligro</p>
        </div>
      </div>

      <p className="text-xs text-red-800 dark:text-red-300/80 mb-6 leading-relaxed flex items-start gap-2 bg-red-50 dark:bg-red-950/30 p-3.5 rounded-xl border border-red-200/30 dark:border-red-900/20">
        <AlertTriangle className="w-4 h-4 text-red-650 dark:text-red-400 shrink-0 mt-0.5" />
        <span>
          Ingresa los identificadores de base de datos (UUIDs) o nombres exactos de las aplicaciones, separados por comas, espacios o saltos de línea. El sistema buscará coincidencias directas y eliminará de forma irreversible cada registro de la base de datos.
        </span>
      </p>

      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        disabled={loading}
        placeholder="950b73c2-d3a1-428d-9610-ea5f27c3ab15&#10;WhatsApp Messenger&#10;8bc5a109-77a8-4c8d-8ef2-cf8b0051a8e1"
        rows={6}
        className="w-full p-4 rounded-xl border border-red-200/60 dark:border-red-900/30 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 text-gray-900 dark:text-white font-mono placeholder:text-gray-400 dark:placeholder:text-slate-600"
      />

      {/* Barra de progreso / Estado de carga */}
      {loading && (
        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-red-750 dark:text-red-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{status}</span>
        </div>
      )}

      {/* Mensaje de Éxito al finalizar */}
      {!loading && resultSummary !== null && (
        <div className="mt-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/35 text-emerald-800 dark:text-emerald-350 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">
            Se han eliminado {resultSummary.deletedCount} aplicaciones con éxito de la base de datos.
          </span>
        </div>
      )}

      {/* Botón de envío */}
      <Button
        onClick={handleDelete}
        disabled={loading}
        className="w-full mt-6 bg-red-650 hover:bg-red-750 text-white font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Procesando Eliminación...
          </>
        ) : (
          <>
            <Trash2 className="w-4 h-4" /> Eliminar Aplicaciones
          </>
        )}
      </Button>
    </div>
  );
}
