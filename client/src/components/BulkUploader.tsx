"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertTriangle, Play } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function BulkUploader() {
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("");
  const [log, setLog] = useState<Array<{ type: "success" | "error" | "warning"; message: string }>>([]);
  const [totals, setTotals] = useState<{ imported: number; duplicated: number; failed: number } | null>(null);

  // Helper para procesar una lista de appIds en lotes de manera segura y progresiva
  const processAppIds = async (allIds: string[]) => {
    setLoading(true);
    setProgress(0);
    setLog([]);
    setTotals({ imported: 0, duplicated: 0, failed: 0 });
    setStatus(`Iniciando procesamiento de ${allIds.length} aplicaciones...`);

    const BATCH_SIZE = 15;
    const totalBatches = Math.ceil(allIds.length / BATCH_SIZE);

    for (let i = 0; i < totalBatches; i++) {
      const start = i * BATCH_SIZE;
      const end = start + BATCH_SIZE;
      const batch = allIds.slice(start, end);

      setStatus(`Procesando lote ${i + 1} de ${totalBatches} (${batch.length} apps)...`);

      try {
        const response = await fetch("/api/bulk-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appIds: batch }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let parsedError = "Error al importar lote";
          try {
            const errJson = JSON.parse(errorText);
            parsedError = errJson.error || parsedError;
          } catch {
            parsedError = errorText || parsedError;
          }
          throw new Error(parsedError);
        }

        const result = await response.json();

        // Actualizar totales acumulados
        setTotals((prev) => {
          if (!prev) return null;
          return {
            imported: prev.imported + (result.importedCount || 0),
            duplicated: prev.duplicated + (result.duplicatedCount || 0),
            failed: prev.failed + (result.failedCount || 0),
          };
        });

        // Registrar éxitos
        if (result.importedCount > 0) {
          setLog((prev) => [
            ...prev,
            {
              type: "success",
              message: `Lote ${i + 1}: ${result.importedCount} importadas con éxito`,
            },
          ]);
        }

        // Registrar duplicados omitidos
        if (result.duplicatedCount > 0) {
          setLog((prev) => [
            ...prev,
            {
              type: "warning",
              message: `Lote ${i + 1}: ${result.duplicatedCount} omitidas por duplicadas`,
            },
          ]);
        }

        // Registrar errores individuales del lote
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach((err: any) => {
            setLog((prev) => [
              ...prev,
              {
                type: "error",
                message: `Error en ${err.appId}: ${err.error}`,
              },
            ]);
          });
        }
      } catch (err: any) {
        console.error(err);
        setLog((prev) => [
          ...prev,
          {
            type: "error",
            message: `Lote ${i + 1} falló por completo: ${err.message || "Error desconocido"}`,
          },
        ]);
        setTotals((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            failed: prev.failed + batch.length,
          };
        });
      }

      const percent = Math.round(((i + 1) / totalBatches) * 100);
      setProgress(percent);
    }

    setStatus("Importación finalizada.");
    setLoading(false);
    toast.success("Importación masiva completada");
    queryClient.invalidateQueries({ queryKey: ["apps"] });
  };

  const handleManualImport = async () => {
    const rawIds = inputText
      .split(/[\n,]+/)
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (rawIds.length === 0) {
      toast.error("Por favor ingresa al menos un ID de Play Store");
      return;
    }

    await processAppIds(rawIds);
  };

  return (
    <div className="space-y-6">
      {/* Panel de Subida Masiva por IDs */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/60 dark:border-slate-700/50">
        <div className="flex items-center gap-3 mb-4">
          <Play className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Subida Masiva de Google Play</h2>
        </div>

        <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">
          Ingresa los Package Names / IDs de Google Play Store (ej. <code className="bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px] font-mono">com.instagram.android</code>) separados por comas o uno por línea. El importador extraerá automáticamente títulos, descripciones, categorías e iconos.
        </p>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          placeholder="com.mojang.minecraftpe&#10;com.spotify.music&#10;com.whatsapp"
          rows={5}
          className="w-full p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-gray-900 dark:text-white font-mono placeholder:text-gray-400"
        />

        <Button
          onClick={handleManualImport}
          disabled={loading}
          className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Procesando Lotes...
            </>
          ) : (
            "Iniciar Inyección Masiva"
          )}
        </Button>
      </div>

      {/* Estado del proceso y Barra de progreso */}
      {loading && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-200/60 dark:border-slate-700/50 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-600 dark:text-slate-350">
            <span className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              {status}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-150 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-amber-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Resumen Final al terminar */}
      {!loading && status === "Importación finalizada." && totals && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/35 rounded-3xl p-5 text-emerald-800 dark:text-emerald-350 shadow-sm">
          <div className="flex items-center gap-2 font-extrabold text-sm mb-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Proceso Completado con Éxito</span>
          </div>
          <p className="text-xs font-bold leading-relaxed">
            Proceso terminado: {totals.imported} apps nuevas agregadas, {totals.duplicated} omitidas por duplicadas.
            {totals.failed > 0 && ` (${totals.failed} fallas registradas)`}
          </p>
        </div>
      )}

      {/* Bitácora de ejecución */}
      {log.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-200/60 dark:border-slate-700/50">
          <h3 className="text-xs font-extrabold text-gray-450 dark:text-slate-500 uppercase tracking-widest mb-4">
            Bitácora de Eventos
          </h3>
          <div className="max-h-48 overflow-y-auto space-y-2 rounded-xl bg-gray-50 dark:bg-slate-900/30 p-4 border border-gray-150/40 dark:border-slate-800/40">
            {log.map((entry, idx) => (
              <div
                key={idx}
                className={`flex gap-2 items-start text-xs font-medium leading-relaxed ${
                  entry.type === "success"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : entry.type === "warning"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-500 dark:text-red-400"
                }`}
              >
                {entry.type === "success" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
                ) : entry.type === "warning" ? (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
                )}
                <span>{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
