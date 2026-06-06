"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ParsedLink {
  appId: string;
  downloadUrl: string;
}

export default function CsvLinkUpdater() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [log, setLog] = useState<Array<{ type: "success" | "error"; message: string }>>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
      toast.error("Por favor selecciona un archivo en formato CSV");
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (fileToParse: File) => {
    Papa.parse(fileToParse, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        
        // Mapear campos de forma flexible (soporta app_id, appId, id, name / download_url, downloadUrl, link)
        const formatted: ParsedLink[] = data
          .map((row) => {
            const appIdKey = Object.keys(row).find((key) =>
              ["app_id", "appid", "id", "name"].includes(key.toLowerCase().trim())
            );
            const urlKey = Object.keys(row).find((key) =>
              ["download_url", "downloadurl", "link", "url"].includes(key.toLowerCase().trim())
            );

            const appId = appIdKey ? String(row[appIdKey]).trim() : "";
            const downloadUrl = urlKey ? String(row[urlKey]).trim() : "";

            return { appId, downloadUrl };
          })
          .filter((item) => item.appId.length > 0 && item.downloadUrl.length > 0);

        setParsedData(formatted);
        if (formatted.length === 0) {
          toast.warning("El archivo CSV no contiene datos válidos o faltan las columnas requeridas");
        } else {
          toast.success(`Se prepararon ${formatted.length} enlaces para actualizar`);
        }
      },
      error: (err) => {
        console.error("Error al procesar CSV:", err);
        toast.error("Ocurrió un error al leer el archivo CSV");
      },
    });
  };

  const handleInject = async () => {
    if (parsedData.length === 0) {
      toast.error("No hay datos de enlaces listos para inyectar");
      return;
    }

    setLoading(true);
    setProgress(0);
    setLog([]);
    setStatus(`Actualizando ${parsedData.length} enlaces de descarga...`);

    // Procesar en lotes (ej. lote de 30) para evitar timeouts
    const BATCH_SIZE = 30;
    const totalBatches = Math.ceil(parsedData.length / BATCH_SIZE);

    for (let i = 0; i < totalBatches; i++) {
      const start = i * BATCH_SIZE;
      const end = start + BATCH_SIZE;
      const batch = parsedData.slice(start, end);

      setStatus(`Actualizando lote ${i + 1} de ${totalBatches}...`);

      try {
        const response = await fetch("/api/bulk-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ links: batch }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Error al procesar lote");
        }

        if (result.updatedCount > 0) {
          setLog((prev) => [
            ...prev,
            {
              type: "success",
              message: `Lote ${i + 1}: ${result.updatedCount} enlaces actualizados exitosamente`,
            },
          ]);
        }

        if (result.errors && result.errors.length > 0) {
          result.errors.forEach((err: any) => {
            setLog((prev) => [
              ...prev,
              {
                type: "error",
                message: `Error en ${err.appId || "Ítem"}: ${err.error}`,
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
      }

      const percent = Math.round(((i + 1) / totalBatches) * 100);
      setProgress(percent);
    }

    setStatus("Actualización masiva completada.");
    setLoading(false);
    toast.success("Actualización de enlaces finalizada");
    queryClient.invalidateQueries({ queryKey: ["apps"] });
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setProgress(0);
    setStatus("");
    setLog([]);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/60 dark:border-slate-700/50">
      <div className="flex items-center gap-3 mb-4">
        <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Actualizador Masivo de Enlaces (CSV)</h2>
      </div>

      <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">
        Sube un archivo CSV con las columnas <code className="bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">app_id</code> (UUID o Nombre) y <code className="bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">download_url</code>. Se actualizará la url de descarga del catálogo de Supabase en segundos de forma segura.
      </p>

      {!file ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-250 dark:border-slate-700/80 rounded-2xl p-8 hover:bg-gray-50 dark:hover:bg-slate-800/40 hover:border-indigo-500/50 cursor-pointer transition-all duration-300 group">
          <UploadCloud className="w-10 h-10 text-gray-400 group-hover:text-indigo-550 transition-colors mb-3" />
          <span className="text-sm font-extrabold text-gray-700 dark:text-slate-300">Arrastra o selecciona tu archivo CSV</span>
          <span className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">Formato admitido: .csv (máximo 500 filas por lote)</span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/30 rounded-xl border border-gray-150/40 dark:border-slate-800/40">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-650 dark:text-indigo-400">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-gray-900 dark:text-white truncate">{file.name}</p>
                <p className="text-[10px] text-gray-400 dark:text-slate-500">{(file.size / 1024).toFixed(1)} KB • {parsedData.length} enlaces listos</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              disabled={loading}
              className="text-xs font-bold text-red-500 hover:text-red-650 transition-colors px-3 py-1 bg-red-50 dark:bg-red-500/10 rounded-lg cursor-pointer disabled:opacity-50"
            >
              Quitar
            </button>
          </div>

          {/* Barra de progreso */}
          {loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-slate-400">
                <span>{status}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Botón de envío */}
          <Button
            onClick={handleInject}
            disabled={loading || parsedData.length === 0}
            className="w-full bg-indigo-650 hover:bg-indigo-755 text-white font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
              </>
            ) : (
              "Inyectar Enlaces a Supabase"
            )}
          </Button>
        </div>
      )}

      {/* Bitácora de ejecución */}
      {log.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
          <h3 className="text-xs font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">
            Bitácora de Actualizaciones
          </h3>
          <div className="max-h-48 overflow-y-auto space-y-2 rounded-xl bg-gray-50 dark:bg-slate-900/30 p-3 border border-gray-150/40 dark:border-slate-800/40">
            {log.map((entry, idx) => (
              <div
                key={idx}
                className={`flex gap-2 items-start text-xs font-medium leading-relaxed ${
                  entry.type === "success"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-500 dark:text-red-400"
                }`}
              >
                {entry.type === "success" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
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
