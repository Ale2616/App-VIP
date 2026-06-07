"use client";

import { useState } from "react";
import { Loader2, Trash2, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function BulkDeleter() {
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [resultSummary, setResultSummary] = useState<{ deletedCount: number } | null>(null);

  const handleDelete = async () => {
    // Dividir por saltos de línea y comas (NO por espacios, para respetar nombres)
    const rawIds = inputText
      .split(/[\n,]+/)
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (rawIds.length === 0) {
      toast.error("Por favor ingresa al menos un ID o Nombre de aplicación");
      return;
    }

    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar ${rawIds.length} aplicaciones? Esta acción NO se puede deshacer.`
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
    <div className="bg-red-50 dark:bg-red-950/15 rounded-3xl p-6 sm:p-8 shadow-sm border-2 border-red-200 dark:border-red-900/40 transition-all">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl">
          <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-red-800 dark:text-red-200">
            Eliminación Masiva
          </h2>
          <p className="text-[11px] font-bold text-red-600 dark:text-red-400/80 uppercase tracking-wider">
            ⚠ Zona de Peligro
          </p>
        </div>
      </div>

      {/* Advertencia */}
      <p className="text-xs text-red-700 dark:text-red-300/80 mb-6 leading-relaxed flex items-start gap-2 bg-red-100/60 dark:bg-red-950/30 p-3.5 rounded-xl border border-red-200 dark:border-red-900/30">
        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <span>
          Ingresa los <strong>UUIDs</strong> o <strong>nombres exactos</strong> de las aplicaciones,
          separados por <strong>comas o saltos de línea</strong>. El sistema buscará coincidencias
          y eliminará de forma <strong>irreversible</strong> cada registro.
        </span>
      </p>

      {/* Textarea */}
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        disabled={loading}
        placeholder={"950b73c2-d3a1-428d-9610-ea5f27c3ab15\nWhatsApp Messenger\nCandy Crush Saga"}
        rows={6}
        className="w-full p-4 rounded-xl border-2 border-red-200 dark:border-red-900/30 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 text-gray-900 dark:text-white font-mono placeholder:text-gray-400 dark:placeholder:text-slate-600"
      />

      {/* Estado de carga */}
      {loading && (
        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{status}</span>
        </div>
      )}

      {/* Resultado */}
      {!loading && resultSummary !== null && (
        <div className="mt-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/35 text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">
            Se han eliminado {resultSummary.deletedCount} aplicaciones con éxito.
          </span>
        </div>
      )}

      {/* Botón principal */}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md border-2 border-red-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
      </button>
    </div>
  );
}
